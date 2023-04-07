import type { UserConfigExport } from '@modern-js/core';
import type { AppLegacyUserConfig, AppUserConfig } from './types';

export const defineConfig = <B extends 'rspack' | 'webpack' = 'webpack'>(
  config: UserConfigExport<AppUserConfig<B>>,
) => config;

/**
 * Recommend use `defineConfig` first.
 *
 * `defineLegacyConfig` will be deprecated in the future.
 */
export const defineLegacyConfig = (
  config: AppLegacyUserConfig,
): AppLegacyUserConfig => ({
  ...config,
  legacy: true,
  autoLoadPlugins: config.autoLoadPlugins ?? true,
});
