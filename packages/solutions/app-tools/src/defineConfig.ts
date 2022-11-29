import { AppUserConfig, AppLegacyUserConfig } from './types';

export const defineConfig = (config: AppUserConfig) => config;

/**
 * @deprecated
 * Using defineConfig first.
 */
export const defineLegacyConfig = (config: AppLegacyUserConfig) => ({
  ...config,
  legacy: true,
});
