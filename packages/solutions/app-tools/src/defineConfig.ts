import { AppToolsUserConfig } from './types/config';
import { AppToolsLegacyNormalizedConfig } from './types/legacyConfig';

export const defineConfig = (config: AppToolsUserConfig) => config;

/**
 * @deprecated
 * Using defineConfig first.
 */
export const defineLegacyConfig = (config: AppToolsLegacyNormalizedConfig) => ({
  ...config,
  legacy: true,
});
