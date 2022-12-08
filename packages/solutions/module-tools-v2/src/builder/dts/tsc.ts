import type { ChildProcess } from 'child_process';
import type { BundlelessGeneratorDtsConfig, ITsconfig } from '../../types';

export const getProjectTsconfig = async (
  tsconfigPath: string,
): Promise<ITsconfig> => {
  const { json5, fs } = await import('@modern-js/utils');
  if (!fs.existsSync(tsconfigPath)) {
    return {};
  }

  return json5.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
};

const resolveLog = async (
  childProgress: ChildProcess,
  options: {
    watch: boolean;
    watchFn: () => Promise<void>;
  },
) => {
  const { watch = false, watchFn = async () => undefined } = options;
  const { SectionTitleStatus, BundlelessDtsLogPrefix } = await import(
    '../../constants/log'
  );
  const { watchSectionTitle } = await import('../../utils/log');
  const { watchDoneText } = await import('../../constants/dts');

  /**
   * tsc 所有的log信息都是从stdout data 事件中获取
   * 正常模式下，如果有报错信息，交给 resolveLog 后面的逻辑来处理
   * watch 模式下，则使用这里的信息
   */
  childProgress.stdout?.on('data', async data => {
    if (watch) {
      console.info(
        await watchSectionTitle(BundlelessDtsLogPrefix, SectionTitleStatus.Log),
      );
      console.info(data.toString());
      if (data.toString().includes(watchDoneText)) {
        await watchFn();
      }
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

const generatorDts = async (config: BundlelessGeneratorDtsConfig) => {
  const { execa } = await import('@modern-js/utils');
  const { InternalDTSError } = await import('../../error');
  const { generatorTsConfig } = await import('../../utils/dts');
  const { getTscBinPath } = await import('../../utils/dts');
  const { tsconfigPath, appDirectory, watch = false } = config;
  const userTsconfig = await getProjectTsconfig(tsconfigPath);
  const result = await generatorTsConfig(userTsconfig, config);

  const tscBinFile = await getTscBinPath(appDirectory);

  const watchParams = watch ? ['-w'] : [];
  const childProgress = execa(
    tscBinFile,
    [
      '-p',
      result.tempTsconfigPath,
      /* Required parameter, use it stdout have color */
      '--pretty',
      // https://github.com/microsoft/TypeScript/issues/21824
      '--preserveWatchOutput',
      ...watchParams,
    ],
    {
      stdio: 'pipe',
      cwd: appDirectory,
    },
  );

  resolveLog(childProgress, {
    watch,
    watchFn: async () => {
      const { resolveAlias } = await import('../../utils/dts');
      await resolveAlias(config, { ...result, userTsconfig });
    },
  });

  try {
    await childProgress;
  } catch (e) {
    if (e instanceof Error) {
      throw new InternalDTSError(e, {
        buildType: 'bundleless',
      });
    }
  }

  return { ...result, userTsconfig };
};

export const runTsc = async (config: BundlelessGeneratorDtsConfig) => {
  const { resolveAlias } = await import('../../utils/dts');
  const result = await generatorDts(config);
  await resolveAlias(config, result);
};
