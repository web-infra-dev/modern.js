import type { UserConfigExport } from '@modern-js/core';
import type { AppLegacyUserConfig, AppUserConfig } from './types';

/**
 * This function helps you to autocomplete configuration types.
 * It accepts a direct config object, or a function that returns a config.
 */
export const defineConfig = <B extends 'rspack' | 'webpack' = 'webpack'>(
  config: UserConfigExport<AppUserConfig<B>>,
) => config;

/**
 * @deprecated Please use `defineConfig` instead.
 * `defineLegacyConfig` will be removed in the future major version.
 */
export const defineLegacyConfig = (
  config: AppLegacyUserConfig,
): AppLegacyUserConfig => ({
  ...config,
  legacy: true,
  autoLoadPlugins: config.autoLoadPlugins ?? true,
});
