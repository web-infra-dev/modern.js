import type { UserConfigExport } from '@modern-js/core';
import type { AppUserConfig } from './types';

/**
 * This function helps you to autocomplete configuration types.
 * It accepts a direct config object, or a function that returns a config.
 */
export const defineConfig = <B extends 'rspack' | 'webpack' = 'webpack'>(
  config: UserConfigExport<AppUserConfig<B>>,
) => config;
