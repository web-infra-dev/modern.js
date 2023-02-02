import type { UserConfigExport } from '@modern-js/core';
import type { AppUserConfig, AppLegacyUserConfig } from './types';

export const defineConfig = (config: UserConfigExport<AppUserConfig>) => config;

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
