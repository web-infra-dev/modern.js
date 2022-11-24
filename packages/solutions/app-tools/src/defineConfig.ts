import { AppToolsUserConfig } from './types/config';
import { LegacyAppToolsUserConfig } from './types/legacyConfig';

export const defineConfig = (config: AppToolsUserConfig) => config;
export const defineLegacyConfig = (config: LegacyAppToolsUserConfig) => ({
  ...config,
  legacy: true,
});
