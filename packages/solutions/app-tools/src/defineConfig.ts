import type { ConfigParams } from '@modern-js/core';
import type { AppUserConfig, AppLegacyUserConfig } from './types';

export const defineConfig = (
  config:
    | AppUserConfig
    | ((params: ConfigParams) => Promise<AppUserConfig> | AppUserConfig),
) => config;

/**
 * @deprecated
 * Using defineConfig first.
 */
export const defineLegacyConfig = (
  config: AppLegacyUserConfig,
): AppLegacyUserConfig => ({
  ...config,
  legacy: true,
});
