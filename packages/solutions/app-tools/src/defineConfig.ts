import { AppToolsUserConfig } from './types/config';
import { AppToolsLegacyUserConfig } from './types/legacyConfig';

export const defineConfig = (config: AppToolsUserConfig) => config;

/**
 * @deprecated
 * Using defineConfig first.
 */
export const defineLegacyConfig = (config: AppToolsLegacyUserConfig) => ({
  ...config,
  legacy: true,
});
