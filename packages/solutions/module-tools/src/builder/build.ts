import { slash, logger, fs } from '@modern-js/utils';
import type {
  BuildCommandOptions,
  BaseBuildConfig,
  ModuleTools,
  PluginAPI,
  DTSOptions,
  ModuleContext,
} from '../types';
import pMap from '../../compiled/p-map';
import { copyTask } from './copy';
import { createCompiler } from './esbuild';

export const runBuildTask = async (
  options: {
    buildConfig: BaseBuildConfig;
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
  },
  api: PluginAPI<ModuleTools>,
) => {
  const { buildConfig, context, buildCmdOptions } = options;
  const { appDirectory } = context;

  await copyTask(buildConfig, { appDirectory, watch: buildCmdOptions.watch });

  const dts = buildCmdOptions.dts ? buildConfig.dts : false;
  const { watch } = buildCmdOptions;
  const existTsconfig = await fs.pathExists(buildConfig.tsconfig);

  if (dts && existTsconfig) {
    const tasks = dts.only ? [generatorDts] : [buildLib, generatorDts];
    await pMap(tasks, async task => {
      await task(buildConfig, api, { watch, dts });
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (dts && dts.only) {
      return;
    }
    await buildLib(buildConfig, api, { watch });
  }
};

export const generatorDts = async (
  config: BaseBuildConfig,
  api: PluginAPI<ModuleTools>,
  options: {
    watch: boolean;
    dts: DTSOptions;
  },
) => {
  const { runRollup, runTsc } = await import('./dts');
  const { watch, dts } = options;
  const { buildType, input, sourceDir, alias, externals, tsconfig } = config;
  const { appDirectory } = api.useAppContext();
  const { distPath, abortOnError, respectExternal } = dts;

  // remove this line after remove dts.tsconfigPath
  const tsconfigPath = dts.tsconfigPath ?? tsconfig;

  if (buildType === 'bundle') {
    await runRollup(api, {
      distDir: distPath,
      watch,
      externals,
      input,
      tsconfigPath,
      abortOnError,
      respectExternal,
      appDirectory,
    });
  } else {
    await runTsc(api, {
      appDirectory,
      alias,
      distAbsPath: distPath,
      watch,
      tsconfigPath,
      sourceDir,
      abortOnError,
    });
  }
};

export const buildLib = async (
  config: BaseBuildConfig,
  api: PluginAPI<ModuleTools>,
  options: {
    watch: boolean;
  },
) => {
  const { watch } = options;
  const { target, buildType, format, externalHelpers } = config;
  const { appDirectory } = api.useAppContext();
  const root = slash(appDirectory);

  const { checkSwcHelpers } = await import('../utils/builder');
  await checkSwcHelpers({ appDirectory, externalHelpers });

  try {
    const compiler = await createCompiler({
      config,
      watch,
      root: appDirectory,
      api,
    });
    await compiler.build();

    const { addOutputChunk } = await import('../utils/print');
    addOutputChunk(compiler.outputChunk, root, buildType === 'bundle');

    if (watch) {
      const { watchSectionTitle } = await import('../utils/log');
      const { SectionTitleStatus } = await import('../constants/log');
      const titleText = `[${
        buildType === 'bundle' ? 'Bundle' : 'Bundleless'
      }: ${format}_${target}]`;

      logger.info(
        await watchSectionTitle(titleText, SectionTitleStatus.Success),
      );
    }
  } catch (e: any) {
    const { InternalBuildError } = await import('../error');
    throw new InternalBuildError(e, {
      target,
      format,
      buildType,
    });
  }
};
