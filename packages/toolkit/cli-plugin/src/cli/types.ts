export interface CLIOptions {
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
}

export type LoadedConfig<T> = {
  packageName: string;
  configFile: string;
  config: T;
  pkgConfig?: T;
};

export interface CLIRunOptions extends CLIOptions {
  command: string;
}
