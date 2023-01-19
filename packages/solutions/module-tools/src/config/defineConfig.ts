import type { ModuleConfigParams, ModuleLegacyUserConfig } from '../types';

export const defineConfig = (config: ModuleConfigParams): ModuleConfigParams =>
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
