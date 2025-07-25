import type { CLIPluginExtends } from '../../types/cli';
import type { Plugin } from '../../types/plugin';
export interface CLIOptions<Extends extends CLIPluginExtends = { config: {} }> {
  cwd?: string;
  version?: string;
  metaName?: string;
  /**
   * The initial log message when CLI started
   */
  initialLog?: string;
  /**
   * other config, overrides config file content
   */
  config?: Extends['config'];
  configFile: string;
  internalPlugins?: Plugin[];
  handleSetupResult?: (
    params: any,
    api: Record<string, any>,
  ) => Promise<void> | void;
}

export type LoadedConfig<T> = {
  packageName: string;
  configFile: string;
  config: T;
  pkgConfig?: T;
  jsConfig?: T;
};

export interface CLIRunOptions<
  Extends extends CLIPluginExtends = { config: {} },
> extends CLIOptions<Extends> {
  command: string;
}
