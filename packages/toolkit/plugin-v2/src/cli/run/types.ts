import type { Plugin } from '../../types/plugin';
export interface CLIOptions<Config> {
  cwd?: string;
  version?: string;
  metaName?: string;
  /**
   * The initial log message when CLI started
   */
  initialLog?: string;
  configFile: string;
  /**
   * @deprecated
   * `package.json` config field, will be removed in the future, expect use configFile instead
   */
  packageJsonConfig?: string;
  loadedConfig?: Config;
  internalPlugins?: Plugin[];
}

export type LoadedConfig<T> = {
  packageName: string;
  configFile: string;
  config: T;
  pkgConfig?: T;
  jsConfig?: T;
};

export interface CLIRunOptions<Config> extends CLIOptions<Config> {
  command: string;
}
