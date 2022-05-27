import path from 'path';
import { Import, glob, fs } from '@modern-js/utils';
import { PluginAPI } from '@modern-js/core';
import type {
  BabelOptions,
  IVirtualDist,
  ICompilerResult,
} from '@modern-js/babel-compiler';
import type { NormalizedBundlessBuildConfig } from '../types';
import type { ITsconfig } from '../../../types';

const babelCompiler: typeof import('@modern-js/babel-compiler') = Import.lazy(
  '@modern-js/babel-compiler',
  require,
);
const pMap: typeof import('p-map') = Import.lazy('p-map', require);

const bc: typeof import('../../../utils/babel') = Import.lazy(
  '../../../utils/babel',
  require,
);
const ts: typeof import('../../../utils/tsconfig') = Import.lazy(
  '../../../utils/tsconfig',
  require,
);

export enum Compiler {
  babel,
  esbuild,
  swc,
}

interface IBuildSourceCodeConfig {
  appDirectory: string;
  babelConfig: BabelOptions;
  srcRootDir: string;
  willCompilerDirOrFile: string;
  distDir: string;
  tsconfigPath: string;
}

export const getWillCompilerCode = (
  srcDirOrFile: string,
  option: { tsconfig: ITsconfig | null; isTsProject: boolean },
) => {
  const { tsconfig, isTsProject } = option;
  // 如果是一个文件路径，则直接返回
  if (fs.existsSync(srcDirOrFile) && fs.lstatSync(srcDirOrFile).isFile()) {
    return [srcDirOrFile];
  }

  const getExts = (isTs: boolean) => {
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

  const exts = getExts(isTsProject);
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
  } = config;
  const tsconfig = ts.readTsConfig(tsconfigPath);
  const willCompilerFiles = getWillCompilerCode(willCompilerDirOrFile, {
    tsconfig,
    isTsProject: Boolean(tsconfig),
  });

  return babelCompiler.compiler(
    {
      quiet: true,
      enableVirtualDist: true,
      rootDir: srcRootDir,
      filenames: willCompilerFiles,
      distDir,
      ignore: ['*.d.ts'],
    },
    babelConfig,
  );
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
  config: NormalizedBundlessBuildConfig,
) => {
  const {
    bundlessOption: { sourceDir },
    tsconfig,
    target,
    format,
    outputPath,
  } = config;
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { path: distPath = 'dist' },
  } = modernConfig;
  const sourceAbsDir = path.join(appDirectory, sourceDir);
  const tsconfigPath = path.join(appDirectory, tsconfig);
  // When there is only one format, the output directory of the build product is '[distDir]/[outputPath]/'
  // In other cases, follow [dist]/[outputPath]/[format]
  const singleFormat = format.length === 1;
  const buildConfigs = format.map(fmt => {
    // TODO: Refactoring based on format and target
    const syntax = target === 'es5' ? 'es5' : 'es6+';
    const type = fmt === 'cjs' ? 'commonjs' : 'module';
    return {
      type,
      syntax,
      babelConfig: bc.resolveBabelConfig(appDirectory, modernConfig, {
        sourceAbsDir,
        tsconfigPath,
        syntax,
        type,
      }),
    };
  });

  await pMap(buildConfigs, async bc => {
    const distDir = path.join(
      appDirectory,
      distPath,
      outputPath,
      singleFormat ? './' : `./${bc.type}`,
    );
    const result = await buildSourceCode({
      appDirectory,
      distDir,
      srcRootDir: sourceAbsDir,
      willCompilerDirOrFile: sourceAbsDir,
      tsconfigPath,
      babelConfig: bc.babelConfig,
    });
    outputDist(result);
  });
};
