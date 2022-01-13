import type { ChildProcess } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import { Import, fs } from '@modern-js/utils';
import type { NormalizedConfig, CoreOptions } from '@modern-js/core';
import type { ITsconfig } from '../types';

const tsPathsTransform: typeof import('../utils/tspaths-transform') =
  Import.lazy('../utils/tspaths-transform', require);
const babel: typeof import('../utils/babel') = Import.lazy(
  '../utils/babel',
  require,
);
const constants: typeof import('./constants') = Import.lazy(
  './constants',
  require,
);

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);

const execa: typeof import('execa') = Import.lazy('execa', require);
const JSON5: typeof import('json5') = Import.lazy('json5', require);
const argv: typeof import('process.argv').default = Import.lazy(
  'process.argv',
  require,
);
const deepMerge: typeof import('lodash.merge') = Import.lazy(
  'lodash.merge',
  require,
);
const glob: typeof import('glob') = Import.lazy('glob', require);

let removeTsconfigPath = '';

const generatorTsConfig = (
  projectTsconfig: ITsconfig,
  {
    appDirectory,
    distDir,
    sourceDir = 'src',
  }: { appDirectory: string; distDir: string; sourceDir?: string },
) => {
  const tempPath = path.resolve(appDirectory, './node_modules');
  const resolvePath = path.relative(tempPath, appDirectory);
  // const rootDir = projectTsconfig.compilerOptions?.rootDir
  //   ? path.join(resolvePath, projectTsconfig.compilerOptions?.rootDir)
  //   : resolvePath;
  // 目前限制 rootDir 的路径为 sourceDir
  const rootDir = path.join(resolvePath, sourceDir);
  const baseUrl = projectTsconfig.compilerOptions?.baseUrl
    ? path.join(appDirectory, projectTsconfig.compilerOptions?.baseUrl)
    : appDirectory;
  // if include = ['src'], final include should be ['../src']
  const include = projectTsconfig.include?.map(includePath =>
    path.join(resolvePath, includePath),
  );
  const exclude = projectTsconfig.exclude?.map(excludePath =>
    path.join(resolvePath, excludePath),
  );

  const resetConfig: ITsconfig = {
    compilerOptions: {
      rootDir,
      baseUrl,
      // Ensure that .d.ts files are created by tsc, but not .js files
      declaration: true,
      emitDeclarationOnly: true,
      outDir: distDir,
    },
    include,
    exclude,
  };

  const recommendOption = {
    // Ensure that Babel can safely transpile files in the TypeScript project
    compilerOptions: {
      isolatedModules: true,
    },
  };

  const tempTsconfigPath = path.join(tempPath, constants.tempTsconfigName);
  fs.ensureFileSync(tempTsconfigPath);
  fs.writeJSONSync(
    tempTsconfigPath,
    deepMerge(
      recommendOption,
      projectTsconfig,
      // 此处是必须要覆盖用户默认配置
      resetConfig,
    ),
  );
  return tempTsconfigPath;
};

const getProjectTsconfig = (tsconfigPath: string | undefined): ITsconfig => {
  if (!tsconfigPath || !fs.existsSync(tsconfigPath)) {
    return {};
  }

  return JSON5.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
};

const resolveLog = (
  childProgress: ChildProcess,
  { tsCheck = false, watch = false } = {},
) => {
  /**
   * tsc 所有的log信息都是从stdout data 事件中获取
   * 正常模式下，如果有报错信息，交给 resolveLog 后面的逻辑来处理
   * watch 模式下，则使用这里的信息
   */
  childProgress.stdout?.on('data', data => {
    if (!tsCheck) {
      return;
    }
    if (watch) {
      console.info(data.toString());
    }
  });
  // 正常以下内容都不会触发，因为tsc 不会产生以下类型的log信息，不过防止意外情况
  childProgress.stdout?.on('error', error => {
    console.error(error.message);
  });
  childProgress.stderr?.on('data', chunk => {
    console.error(chunk.toString());
  });
};

interface IGeneratorConfig {
  sourceDirName?: string;
  srcDir: string;
  distDir: string;
  projectData: {
    appDirectory: string;
  };
  tsconfigPath?: string;
  tsCheck?: boolean;
  watch?: boolean;
}

const generatorDts = async (_: NormalizedConfig, config: IGeneratorConfig) => {
  const {
    tsconfigPath,
    distDir,
    sourceDirName = 'src',
    projectData: { appDirectory },
    tsCheck = false,
    watch = false,
  } = config;

  const userTsconfig = getProjectTsconfig(tsconfigPath);
  const willDeleteTsconfigPath = generatorTsConfig(userTsconfig, {
    appDirectory,
    distDir,
    sourceDir: sourceDirName,
  });
  removeTsconfigPath = willDeleteTsconfigPath;
  const tscBinFile = path.join(appDirectory, './node_modules/.bin/tsc');
  const watchParams = watch ? ['-w'] : [];
  const childProgress = execa(
    tscBinFile,
    ['-p', willDeleteTsconfigPath, ...watchParams],
    {
      stdio: 'pipe',
      cwd: appDirectory,
    },
  );
  resolveLog(childProgress, { tsCheck, watch });
  try {
    await childProgress;
    console.info('[Tsc Compiler]: Successfully');
  } catch (e) {
    if (!tsCheck) {
      console.warn(
        `There are some type issues, which can be checked by configuring 'source.enableTsChecker = true' ${os.EOL} in modern.config.js`,
      );
    } else {
      const isRecord = (input: any): input is Record<string, any> =>
        typeof input === 'object';
      // 通过使用 execa，可以将tsc 的 data 类型的报错信息变为异常错误信息
      if (isRecord(e)) {
        console.error(e.stdout);
      }
    }
  }
  fs.removeSync(willDeleteTsconfigPath);
};

const resolveAlias = (
  modernConfig: NormalizedConfig,
  config: IGeneratorConfig,
  watchFilenames: string[] = [],
) => {
  const { output } = modernConfig;
  const defaultPaths = { '@': ['./src'] };
  const dtsDistPath = `${config.distDir}/**/*.d.ts`;
  const dtsFilenames =
    watchFilenames.length > 0
      ? watchFilenames
      : glob.sync(dtsDistPath, { absolute: true });
  const alias = babel.getFinalAlias(modernConfig, {
    appDirectory: config.projectData.appDirectory,
    tsconfigPath:
      config.tsconfigPath ||
      path.join(config.projectData.appDirectory, './tsconfig.json'),
    sourceAbsDir: config.distDir,
  });
  const mergedPaths = alias.isTsPath
    ? alias.paths || {}
    : { ...defaultPaths, ...(alias.paths || {}) };
  const result = tsPathsTransform.transformDtsAlias({
    filenames: dtsFilenames,
    baseUrl: path.join(config.projectData.appDirectory, output.path || 'dist'),
    paths: mergedPaths,
  });
  for (const r of result) {
    fs.writeFileSync(r.path, r.content);
  }
};

interface ITaskConfig {
  srcDir: string;
  sourceDirName: string;
  distDir: string;
  appDirectory: string;
  tsconfigPath?: string;
  tsCheck?: boolean;
  watch?: boolean;
  debug?: boolean;
}

const taskMain = async ({
  modernConfig,
}: {
  modernConfig: NormalizedConfig;
}) => {
  const processArgv = argv(process.argv.slice(2));
  const config = processArgv<ITaskConfig>({
    appDirectory: process.cwd(),
    srcDir: 'src',
    distDir: 'dist/types',
    tsconfigPath: './tsconfig.json',
    sourceDirName: 'src',
  });

  const option = {
    srcDir: config.srcDir,
    distDir: config.distDir,
    projectData: { appDirectory: config.appDirectory },
    tsconfigPath: config.tsconfigPath,
    watch: config.watch,
    tsCheck: config.tsCheck,
    sourceDirName: config.sourceDirName,
  };
  await generatorDts(modernConfig, option);
  // TODO: watch 模式下无法转换
  resolveAlias(modernConfig, option);
};

(async () => {
  let options: CoreOptions | undefined;
  if (process.env.CORE_INIT_OPTION_FILE) {
    ({ options } = require(process.env.CORE_INIT_OPTION_FILE));
  }
  const { resolved } = await core.cli.init([], options);
  await core.manager.run(async () => {
    try {
      await taskMain({ modernConfig: resolved });
    } catch (e: any) {
      console.error(e.message);
      fs.removeSync(removeTsconfigPath);
    }
  });
})();
