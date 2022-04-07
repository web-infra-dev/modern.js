import type { ChildProcess } from 'child_process';
import { Import, fs, isObject } from '@modern-js/utils';
import type { NormalizedConfig, CoreOptions } from '@modern-js/core';
import type { ITsconfig } from '../../types';
import { getTscBinPath, IGeneratorConfig } from './utils';

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
const utils: typeof import('./utils') = Import.lazy('./utils', require);

let removeTsconfigPath = '';

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
  const willDeleteTsconfigPath = utils.generatorTsConfig(userTsconfig, {
    appDirectory,
    distDir,
    sourceDir: sourceDirName,
  });
  removeTsconfigPath = willDeleteTsconfigPath;
  const tscBinFile = getTscBinPath(appDirectory);

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
    console.info('[TSC Compiler]: Successfully');
  } catch (e) {
    if (!tsCheck) {
      console.info(
        `There are some type warnings, which can be checked by configuring 'output.disableTsChecker = false'`,
      );
    }
    // 通过使用 execa，可以将 tsc 的 data 类型的报错信息变为异常错误信息
    else if (isObject(e) && e.stdout) {
      console.error(e.stdout);
    } else {
      console.error(e);
    }
  }
  fs.removeSync(willDeleteTsconfigPath);
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
  // // TODO: watch 模式下无法转换
  utils.resolveAlias(modernConfig, option);
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
