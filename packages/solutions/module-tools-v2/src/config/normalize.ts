import path from 'path';
import type { PluginAPI } from '@modern-js/core';
import type {
  UserConfig,
  BaseBuildConfig,
  BuildPreset,
  PartialBuildConfig,
  PartialBaseBuildConfig,
  ModuleContext,
  BuildCommandOptions,
} from '../types';

export const transformBuildPresetToBaseConfigs = async (
  options: {
    context: ModuleContext;
    buildCmdOptions: BuildCommandOptions;
  },
  preset?: BuildPreset,
): Promise<BaseBuildConfig[]> => {
  const { BuildInPreset, presetList } = await import(
    '../constants/build-presets'
  );
  const { addEntryToPreset } = await import('../utils/entry');

  if (typeof preset === 'function') {
    const partialBuildConfig = await preset({ preset: BuildInPreset });

    if (!partialBuildConfig) {
      throw new Error('buildPreset函数不允许返回值为空');
    }

    return transformBuildConfigToBaseConfigs(partialBuildConfig, options);
  }

  const inPresetList = (p: string): p is keyof typeof presetList =>
    p in presetList;

  if (preset && inPresetList(preset)) {
    return transformBuildConfigToBaseConfigs(
      await addEntryToPreset(presetList[preset], options.context),
      options,
    );
  }

  // buildConfig and buildPreset is undefined
  return transformBuildConfigToBaseConfigs(
    await addEntryToPreset(presetList['base-config'], options.context),
    options,
  );
};

export const transformBuildConfigToBaseConfigs = async (
  config: PartialBuildConfig,
  options: {
    buildCmdOptions: BuildCommandOptions;
    context: ModuleContext;
  },
): Promise<BaseBuildConfig[]> => {
  const { buildCmdOptions } = options;
  const { ensureArray } = await import('@modern-js/utils');
  const { assignTsConfigPath } = await import('../utils/dts');
  const partialConfigs = ensureArray(config);
  const configs = await Promise.all(
    partialConfigs.map(async config => {
      let newConfig = await requiredBuildConfig(config, options.context);
      newConfig = await assignTsConfigPath(newConfig, buildCmdOptions);
      newConfig = await transformToAbsPath(newConfig, options);
      return newConfig;
    }),
  );
  return configs;
};

export const requiredBuildConfig = async (
  partialBuildConfig: PartialBaseBuildConfig,
  context: ModuleContext,
): Promise<BaseBuildConfig> => {
  const { lodash } = await import('@modern-js/utils');
  const { defaultBundleBuildConfig, defaultBundlelessBuildConfig } =
    await import('../constants/build');
  const { getDefaultIndexEntry } = await import('../utils/entry');
  return partialBuildConfig.buildType === 'bundle'
    ? lodash.merge(
        {},
        defaultBundleBuildConfig,
        { bundleOptions: { entry: await getDefaultIndexEntry(context) } },
        partialBuildConfig,
      )
    : lodash.merge({}, defaultBundlelessBuildConfig, partialBuildConfig);
};

export const transformToAbsPath = async (
  baseConfig: BaseBuildConfig,
  options: { context: ModuleContext; buildCmdOptions: BuildCommandOptions },
) => {
  let newConfig = baseConfig;
  const { transformEntryToAbsPath } = await import('../utils/entry');
  const { context } = options;

  newConfig.path = path.isAbsolute(newConfig.path)
    ? newConfig.path
    : path.join(context.appDirectory, newConfig.path);

  // `bundlelessOptions.sourceDir` or `bundleOptions.entry`
  if (newConfig.buildType === 'bundleless') {
    newConfig.bundlelessOptions.sourceDir = path.join(
      context.appDirectory,
      newConfig.bundlelessOptions.sourceDir,
    );
  } else {
    newConfig = await transformEntryToAbsPath(newConfig, {
      appDirectory: context.appDirectory,
    });
  }

  // dts path
  if (newConfig.dts) {
    newConfig.dts.distPath = path.join(newConfig.path, newConfig.dts.distPath);
    newConfig.dts.tsconfigPath = path.join(
      context.appDirectory,
      newConfig.dts.tsconfigPath,
    );
  }

  // Maybe need transform 'config.copy'

  return newConfig;
};

export const checkConfig = async (config: UserConfig) => {
  const { buildConfig, buildPreset } = config;
  if (buildConfig && buildPreset) {
    const { logger } = await import('@modern-js/utils');
    logger.warn(
      `因为同时出现 'buildConfig' 和 'buildPreset' 配置，因此仅 'buildConfig' 配置生效`,
    );
  }
};

export const normalizeBuildConfig = async (
  api: PluginAPI,
  context: ModuleContext,
  buildCmdOptions: BuildCommandOptions,
): Promise<BaseBuildConfig[]> => {
  const config = api.useResolvedConfigContext() as unknown as UserConfig;
  // const { appDirectory } = context;
  const { buildConfig, buildPreset } = config;

  await checkConfig(config);

  let baseConfigs: BaseBuildConfig[];

  // buildConfig High priority
  if (buildConfig) {
    baseConfigs = await transformBuildConfigToBaseConfigs(buildConfig, {
      buildCmdOptions,
      context,
    });
  } else {
    baseConfigs = await transformBuildPresetToBaseConfigs(
      {
        context,
        buildCmdOptions,
      },
      buildPreset,
    );
  }

  return baseConfigs;
};
