import type { ConfigParams } from '@modern-js/core';
import type { ModuleConfigParams, ModuleLegacyUserConfig } from '../types';

export const defineConfig = (
  config:
    | ModuleConfigParams
    | ((
        params: ConfigParams,
      ) => Promise<ModuleConfigParams> | ModuleConfigParams),
) => config;

/**
 * @deprecated
 * Using defineConfig first.
 */
export const defineLegacyConfig = (
  config: ModuleLegacyUserConfig,
): ModuleLegacyUserConfig => ({
  ...config,
  legacy: true,
  autoLoadPlugins: true,
});
