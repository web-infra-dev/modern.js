import type { UserConfigExport } from '@modern-js/core';
import type { AppLegacyUserConfig } from './types';

export const defineConfig = <B extends 'rspack' | 'webpack' = 'webpack'>(
  config: UserConfigExport<B>,
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
