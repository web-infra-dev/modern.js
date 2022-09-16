import type { PluginAPI } from '@modern-js/core';
import type { UserConfig, BaseBuildConfig } from '../types';

export const normalizeBuildConfig = (api: PluginAPI): BaseBuildConfig[] => {
  const { buildConfig } =
    api.useResolvedConfigContext() as unknown as UserConfig;
  return (
    Array.isArray(buildConfig) ? buildConfig : [buildConfig]
  ) as BaseBuildConfig[];
};
