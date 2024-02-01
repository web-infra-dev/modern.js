import type { ChildProcess } from 'child_process';
import path from 'path';
import { execa, logger, chalk } from '@modern-js/utils';
import type { GeneratorDtsConfig, PluginAPI, ModuleTools } from '../../types';
import {
  getTscBinPath,
  printOrThrowDtsErrors,
  addDtsFiles,
  withLogTitle,
  processDtsFilesAfterTsc,
  detectTSVersion,
} from '../../utils';
import { watchDoneText } from '../../constants/dts';

export const removeTscLogTime = (log: string) => log.replace(/\[.*\]\s/, '');

const resolveLog = async (
  childProgress: ChildProcess,
  options: {
    watch: boolean;
    watchFn: () => Promise<void>;
  },
) => {
  const { watch = false, watchFn = async () => undefined } = options;

  /**
   * tsc 所有的log信息都是从stdout data 事件中获取
   * 正常模式下，如果有报错信息，交给 resolveLog 后面的逻辑来处理
   * watch 模式下，则使用这里的信息
   */
  childProgress.stdout?.on('data', async data => {
    if (watch) {
      const lines = (data.toString() as string)
        .split('\n')
        // remove empty lines
        .filter(line => line.trim() !== '')
        // add tsc prefix, remove time prefix
        .map(line => withLogTitle('tsc', removeTscLogTime(line)));
      logger.info(lines.join('\n'));

      if (data.toString().includes(watchDoneText)) {
        await watchFn();
      }
    }
  });
  // 正常以下内容都不会触发，因为tsc 不会产生以下类型的log信息，不过防止意外情况
  childProgress.stdout?.on('error', error => {
    logger.error(error.message);
  });
  childProgress.stderr?.on('data', chunk => {
    logger.error(chunk.toString());
  });
};

const runTscBin = async (
  api: PluginAPI<ModuleTools>,
  config: GeneratorDtsConfig,
) => {
  const {
    appDirectory,
    watch = false,
    abortOnError = true,
    tsconfigPath,
    userTsconfig,
    distPath,
    enableTscBuild,
  } = config;

  const tscBinFile = await getTscBinPath(appDirectory);

  const params: string[] = [];

  // avoid error TS6305
  if (enableTscBuild) {
    params.push('-b', tsconfigPath);

    const {
      baseUrl = '.',
      outDir,
      emitDeclarationOnly,
      declaration,
      declarationDir,
    } = userTsconfig.compilerOptions ?? {};
    const abosultBaseUrl = path.isAbsolute(baseUrl)
      ? baseUrl
      : path.join(path.dirname(tsconfigPath), baseUrl);

    // can not set '--declartionDir' or '--ourDir' with '--build'.
    if (
      (!outDir || path.resolve(abosultBaseUrl, outDir) !== distPath) &&
      (!declarationDir ||
        path.resolve(abosultBaseUrl, declarationDir) !== distPath)
    ) {
      const correctOutDir = path.relative(abosultBaseUrl, distPath);
      const info = outDir && !declarationDir ? 'outDir' : 'declarationDir';
      logger.error(
        `Please set ${info}: "${correctOutDir}" in ${chalk.underline(
          tsconfigPath,
        )} to keep it same as buildConfig.`,
      );
    }

    // can not set '--declaration' and '--emitDeclarationOnly' with '--build' if ts is not v5.
    const tsVersion = await detectTSVersion(appDirectory);
    if (tsVersion !== 5) {
      if (!declaration || !emitDeclarationOnly) {
        logger.error(
          `Please set declaration: true and emitDeclarationOnly: true in ${chalk.underline(
            tsconfigPath,
          )}`,
        );
      }
    } else {
      params.push('--declaration', '--emitDeclarationOnly');
    }
  } else {
    params.push(
      '-p',
      tsconfigPath,
      // Same as dts.distPath
      '--declarationDir',
      distPath,
      // Only emit d.ts files
      '--declaration',
      '--emitDeclarationOnly',
    );
  }

  if (watch) {
    params.push('-w');
  }

  const childProgress = execa(
    tscBinFile,
    [
      ...params,
      /* Required parameter, use it stdout have color */
      '--pretty',
      // https://github.com/microsoft/TypeScript/issues/21824
      '--preserveWatchOutput',
    ],
    {
      stdio: 'pipe',
      cwd: appDirectory,
    },
  );

  const runner = api.useHookRunners();
  resolveLog(childProgress, {
    watch,
    watchFn: async () => {
      await processDtsFilesAfterTsc(config);
      runner.buildWatchDts({ buildType: 'bundleless' });
    },
  });

  try {
    await childProgress;
  } catch (e) {
    await printOrThrowDtsErrors(e, { abortOnError, buildType: 'bundleless' });
  }
};

export const runTsc = async (
  api: PluginAPI<ModuleTools>,
  config: GeneratorDtsConfig,
) => {
  await runTscBin(api, config);
  await processDtsFilesAfterTsc(config);
  await addDtsFiles(config.distPath, config.appDirectory);
};
