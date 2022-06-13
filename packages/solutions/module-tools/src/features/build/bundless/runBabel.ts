import path from 'path';
import { Import, glob, fs } from '@modern-js/utils';
import { PluginAPI } from '@modern-js/core';
import type {
  BabelOptions,
  IVirtualDist,
  ICompilerResult,
  BuildWatchEmitter,
} from '@modern-js/babel-compiler';
import type { NormalizedBundlelessBuildConfig } from '../types';
import type { ITsconfig } from '../../../types';

const babelCompiler: typeof import('@modern-js/babel-compiler') = Import.lazy(
  '@modern-js/babel-compiler',
  require,
);

const bc: typeof import('../../../utils/babel') = Import.lazy(
  '../../../utils/babel',
  require,
);
const ts: typeof import('../../../utils/tsconfig') = Import.lazy(
  '../../../utils/tsconfig',
  require,
);

const logger: typeof import('../logger') = Import.lazy('../logger', require);

export enum Compiler {
  babel,
  esbuild,
  swc,
}

interface IBuildSourceCodeConfig {
  appDirectory: string;
  watch?: boolean;
  babelConfig: BabelOptions;
  srcRootDir: string;
  willCompilerDirOrFile: string;
  distDir: string;
  tsconfigPath: string;
}

const getExts = (isTs: boolean, tsconfig: ITsconfig | null) => {
  // TODO: 是否受控tsconfig.json 里的jsx配置
  let exts = [];
  if (isTs) {
    exts = tsconfig?.compilerOptions?.allowJs
      ? ['.ts', '.tsx', '.js', '.jsx']
      : ['.ts', '.tsx'];
  } else {
    exts = ['.js', '.jsx'];
  }

  return exts;
};

export const getWillCompilerCode = (
  srcDirOrFile: string,
  option: { tsconfig: ITsconfig | null; isTsProject: boolean },
) => {
  const { tsconfig, isTsProject } = option;
  // 如果是一个文件路径，则直接返回
  if (fs.existsSync(srcDirOrFile) && fs.lstatSync(srcDirOrFile).isFile()) {
    return [srcDirOrFile];
  }

  const exts = getExts(isTsProject, tsconfig);
  const globPattern = `${srcDirOrFile}/**/*{${exts.join(',')}}`;
  const files = glob.sync(globPattern, {
    ignore: [`${srcDirOrFile}/**/*.d.ts`],
    absolute: true,
  });

  return files;
};

export const buildSourceCode = async (config: IBuildSourceCodeConfig) => {
  const {
    willCompilerDirOrFile,
    tsconfigPath,
    babelConfig,
    srcRootDir,
    distDir,
    watch,
  } = config;
  const tsconfig = ts.readTsConfig(tsconfigPath);
  const willCompilerFiles = getWillCompilerCode(willCompilerDirOrFile, {
    tsconfig,
    isTsProject: Boolean(tsconfig),
  });
  if (watch) {
    const emitter = await babelCompiler.compiler(
      {
        quiet: true,
        enableVirtualDist: true,
        enableWatch: true,
        rootDir: srcRootDir,
        filenames: willCompilerFiles,
        distDir,
        watchDir: srcRootDir,
        extensions: getExts(Boolean(tsconfig), tsconfig),
        ignore: ['*.d.ts'],
      },
      babelConfig,
    );
    return emitter;
  } else {
    return babelCompiler.compiler(
      {
        quiet: true,
        enableVirtualDist: true,
        rootDir: srcRootDir,
        filenames: willCompilerFiles,
        distDir,
        // enableWatch: watch,
        ignore: ['*.d.ts'],
      },
      babelConfig,
    );
  }
};

const generatorRealFiles = (virtualDists: IVirtualDist[]) => {
  for (const virtualDist of virtualDists) {
    const { distPath, code, sourcemap, sourceMapPath } = virtualDist;
    fs.ensureFileSync(distPath);
    fs.writeFileSync(distPath, code);
    if (sourcemap.length > 0) {
      fs.ensureFileSync(sourceMapPath);
      fs.writeFileSync(sourceMapPath, sourcemap);
    }
  }
};

const outputDist = (outputResults: ICompilerResult) => {
  const { code, message, messageDetails, virtualDists = [] } = outputResults;
  if (code === 0) {
    generatorRealFiles(virtualDists);
    // 执行成功log使用 console.info
    console.info('[Babel Compiler]: Successfully');
  } else if (messageDetails && messageDetails.length > 0) {
    console.error(message);
    for (const detail of messageDetails || []) {
      console.error(detail.content);
    }
  }
};

export const runBabelBuild = async (
  api: PluginAPI,
  config: NormalizedBundlelessBuildConfig,
) => {
  const {
    bundlessOption: { sourceDir },
    tsconfig,
    target,
    format,
    outputPath,
    watch,
  } = config;
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { path: distPath = 'dist' },
  } = modernConfig;
  const sourceAbsDir = path.join(appDirectory, sourceDir);
  const tsconfigPath = path.join(appDirectory, tsconfig);

  // TODO: Refactoring based on format and target
  const syntax = target === 'es5' ? 'es5' : 'es6+';
  const type = format === 'cjs' ? 'commonjs' : 'module';
  const buildConfig = {
    format,
    target,
    babelConfig: bc.resolveBabelConfig(appDirectory, modernConfig, {
      sourceAbsDir,
      tsconfigPath,
      syntax,
      type,
    }),
  };

  const distDir = path.join(
    appDirectory,
    distPath,
    outputPath,
  );
  const result = await buildSourceCode({
    appDirectory,
    distDir,
    srcRootDir: sourceAbsDir,
    willCompilerDirOrFile: sourceAbsDir,
    tsconfigPath,
    babelConfig: buildConfig.babelConfig,
    watch,
  });
  if (watch) {
    const emitter = result as BuildWatchEmitter;
    console.info(emitter);
    emitter.on(babelCompiler.BuildWatchEvent.compiling, () => {
      console.info(logger.clearFlag, `Compiling...`);
    });
    emitter.on(
      babelCompiler.BuildWatchEvent.firstCompiler,
      (result: ICompilerResult) => {
        if (result.code === 1) {
          console.error(logger.clearFlag);
          console.error(result.message);
          for (const detail of result.messageDetails || []) {
            console.error(detail.content);
          }
        } else {
          generatorRealFiles(result.virtualDists!);
          console.info(logger.clearFlag, '[Babel Compiler]: Successfully');
        }
      },
    );
    emitter.on(
      babelCompiler.BuildWatchEvent.watchingCompiler,
      (result: ICompilerResult) => {
        if (result.code === 1) {
          console.error(logger.clearFlag);
          console.error(result.message);
          for (const detail of result.messageDetails || []) {
            console.error(detail.content);
          }
          if (
            Array.isArray(result.virtualDists) &&
            result.virtualDists?.length > 0
          ) {
            generatorRealFiles(result.virtualDists);
          }
        } else {
          generatorRealFiles(result.virtualDists!);
          console.info(result.message);
        }
      },
    );
    await emitter.watch();
  } else {
    outputDist(result as ICompilerResult);
  }
};
