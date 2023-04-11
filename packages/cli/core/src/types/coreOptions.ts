import type { ErrorObject } from '@modern-js/utils/compiled/ajv';
import type { InternalPlugins } from './plugin';
import type { ToolsType } from './context';
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
  onSchemaError?: (error: ErrorObject) => void;
  options?: {
    metaName?: string;
    srcDir?: string;
    distDir?: string;
    sharedDir?: string;
  };
  toolsType?: ToolsType;

  /** force the modern-js core auto register plugin exist in the package.json  */
  forceAutoLoadPlugins?: boolean;

  /** config for Node API */
  loadedConfig?: UserConfig;
}
