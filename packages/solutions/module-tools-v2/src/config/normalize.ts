import type { PluginAPI } from '@modern-js/core';
import type {
  UserConfig,
  BaseBuildConfig,
  BuildPreset,
  PartialBuildConfig,
  PartialBaseBuildConfig,
} from '../types';

export const transformBuildPresetToBaseConfigs = async (
  preset?: BuildPreset,
): Promise<BaseBuildConfig[]> => {
  const { BuildInPreset, presetList } = await import('../constants/build');

  if (typeof preset === 'function') {
    const partialBuildConfig = await preset({ preset: BuildInPreset });

    if (!partialBuildConfig) {
      throw new Error('buildPreset函数不允许返回值为空');
    }

    return transformBuildConfigToBaseConfigs(partialBuildConfig);
  }

  const inPresetList = (p: string): p is keyof typeof presetList =>
    p in presetList;

  if (preset && inPresetList(preset)) {
    return transformBuildConfigToBaseConfigs(presetList[preset]);
  }

  // buildConfig and buildPreset is undefined
  return transformBuildConfigToBaseConfigs(presetList['npm-library']);
};

export const transformBuildConfigToBaseConfigs = async (
  config: PartialBuildConfig,
): Promise<BaseBuildConfig[]> => {
  const { ensureArray } = await import('@modern-js/utils');
  const partialConfigs = ensureArray(config);
  const configs = await Promise.all(partialConfigs.map(requiredBuildConfig));
  return configs;
};

export const requiredBuildConfig = async (
  partialBuildConfig: PartialBaseBuildConfig,
): Promise<BaseBuildConfig> => {
  const { lodash } = await import('@modern-js/utils');
  const { defaultBundleBuildConfig, defaultBundlelessBuildConfig } =
    await import('../constants/build');
  return partialBuildConfig.buildType === 'bundle'
    ? lodash.merge(defaultBundleBuildConfig, partialBuildConfig)
    : lodash.merge(defaultBundlelessBuildConfig, partialBuildConfig);
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
): Promise<BaseBuildConfig[]> => {
  const config = api.useResolvedConfigContext() as unknown as UserConfig;
  const { buildConfig, buildPreset } = config;

  await checkConfig(config);

  // buildConfig High priority
  if (buildConfig) {
    return transformBuildConfigToBaseConfigs(buildConfig);
  }

  return transformBuildPresetToBaseConfigs(buildPreset);
};
