import type { UserConfigExport } from '@modern-js/core';
import type { ModuleConfigParams, ModuleLegacyUserConfig } from '../types';

export const defineConfig = (config: UserConfigExport<ModuleConfigParams>) =>
  config;

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
