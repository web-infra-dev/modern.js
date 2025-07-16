import type { AppUserConfig } from './types';

export type ConfigParams = {
  env: string;
  command: string;
};

export type UserConfigExport<Config> =
  | Config
  | ((env: ConfigParams) => Config | Promise<Config>);

/**
 * This function helps you to autocomplete configuration types.
 * It accepts a direct config object, or a function that returns a config.
 */
export const defineConfig = (config: UserConfigExport<AppUserConfig>) => config;
