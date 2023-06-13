import type { InternalPlugins } from './plugin';
import type { UserConfig } from './config';

export interface CoreOptions {
  cwd?: string;
  version?: string;
  configFile?: string;
  serverConfigFile?: string;
  packageJsonConfig?: string;
  internalPlugins?: {
    cli?: InternalPlugins;
    server?: InternalPlugins;
    autoLoad?: InternalPlugins;
  };
  options?: {
    metaName?: string;
    srcDir?: string;
    distDir?: string;
    sharedDir?: string;
  };

  /** force the modern-js core auto register plugin exist in the package.json  */
  forceAutoLoadPlugins?: boolean;

  /** config for Node API */
  loadedConfig?: UserConfig;
}
