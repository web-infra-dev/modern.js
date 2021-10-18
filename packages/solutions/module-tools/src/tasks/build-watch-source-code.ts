import { Import, fs } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';
import type { ICompilerResult, IVirtualDist } from '@modern-js/babel-compiler';
import type { ITsconfig } from '../types';

const babelCompiler: typeof import('@modern-js/babel-compiler') = Import.lazy(
  '@modern-js/babel-compiler',
  require,
);
const logger: typeof import('../features/build/logger') = Import.lazy(
  '../features/build/logger',
  require,
);
const ts: typeof import('../utils/tsconfig') = Import.lazy(
  '../utils/tsconfig',
  require,
);
const babel: typeof import('../utils/babel') = Import.lazy(
  '../utils/babel',
  require,
);
const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const argv: typeof import('process.argv').default = Import.lazy(
  'process.argv',
  require,
);

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

const runBabelCompiler = async (
  config: ITaskConfig,
  modernConfig: NormalizedConfig,
) => {
  const { tsconfigPath } = config;
  const babelConfig = babel.resolveBabelConfig(
    config.appDirectory,
    modernConfig,
    {
      sourceAbsDir: config.srcRootDir,
      tsconfigPath,
      syntax: config.syntax,
      type: config.type,
    },
  );
  const tsconfig = ts.readTsConfig<ITsconfig>(tsconfigPath || '', {});
  const isTs = Boolean(tsconfig);

  const getExts = (isTsProject: boolean) => {
    // TODO: 是否受控tsconfig.json 里的jsx配置
    let exts = [];
    if (isTsProject) {
      exts = tsconfig?.compilerOptions?.allowJs
        ? ['.ts', '.tsx', '.js', '.jsx']
        : ['.ts', '.tsx'];
    } else {
      exts = ['.js', '.jsx'];
    }

    return exts;
  };
  const emitter = await babelCompiler.compiler(
    {
      enableVirtualDist: true,
      quiet: true,
      enableWatch: true,
      rootDir: config.srcRootDir,
      distDir: config.distDir,
      watchDir: config.srcRootDir,
      extensions: getExts(isTs),
    },
    babelConfig,
  );
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
};

const buildSourceCode = async (
  config: ITaskConfig,
  modernConfig: NormalizedConfig,
) => {
  const { compiler } = config;
  if (compiler === 'babel') {
    await runBabelCompiler(config, modernConfig);
  }
};

interface ITaskConfig {
  srcRootDir: string; // 源码的根目录
  distDir: string;
  appDirectory: string;
  sourceMaps: boolean;
  syntax: 'es5' | 'es6+';
  type: 'module' | 'commonjs';
  tsconfigPath: string;
  copyDirs?: string;
  compiler?: 'babel' | 'esbuild' | 'swc';
}

const taskMain = async ({
  modernConfig,
}: {
  modernConfig: NormalizedConfig;
}) => {
  const processArgv = argv(process.argv.slice(2));
  const config = processArgv<ITaskConfig>({
    srcRootDir: `${process.cwd()}/src`,
    distDir: '',
    compiler: 'babel',
    appDirectory: '',
    sourceMaps: false,
    tsconfigPath: '',
    syntax: 'es5',
    type: 'module',
  });

  await buildSourceCode(config, modernConfig);
};

(async () => {
  const { resolved } = await core.cli.init();
  await core.manager.run(async () => {
    try {
      await taskMain({ modernConfig: resolved });
    } catch (e) {
      console.error(e);
    }
  });
})();
