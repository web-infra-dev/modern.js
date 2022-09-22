import type { PluginAPI } from '@modern-js/core';
import type { UserConfig, BaseBuildConfig } from '../types';

export const normalizeBuildConfig = async (
  api: PluginAPI,
): Promise<BaseBuildConfig[]> => {
  const { ensureArray } = await import('@modern-js/utils');
  const { buildConfig } =
    api.useResolvedConfigContext() as unknown as UserConfig;
  if (!buildConfig) {
    return [];
  }

  return ensureArray(buildConfig) as BaseBuildConfig[];
};
