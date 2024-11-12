import type { ServerRoute } from '@modern-js/types';
import type {
  UniBuilderInstance,
  UniBuilderWebpackInstance,
} from '@modern-js/uni-builder';
import type { Hooks } from '../../cli/hooks';
import type { AsyncHook, PluginHook } from '../hooks';
import type { CLIPluginAPI } from './api';
import type { CLIPlugin } from './plugin';

export interface Entrypoint {
  name: string;
  entry: string;
}

/** The public context */
export type AppContext<Config, NormalizedConfig> = {
  // current project package name
  packageName: string;
  // current config file absolute path
  configFile: string;
  // current command name
  command: string;
  // is prod mode
  isProd: boolean;
  // project root path
  appDirectory: string;
  // project src code path
  srcDirectory?: string;
  // project output path
  distDirectory?: string;
  // node_modules path
  nodeModulesDirectory?: string;
  // cli plugins list
  plugins: CLIPlugin<Config, NormalizedConfig>[];
  // bundler type
  bundlerType?: 'webpack' | 'rspack' | 'esbuild';
  // bundler instance
  builder?: UniBuilderInstance | UniBuilderWebpackInstance;
  // current server port
  port?: number;
  // current server host name
  host?: string;
  // current server ip address
  ip?: string;
  // server routes
  serverRoutes?: ServerRoute[];
};

/** The inner context. */
export type InternalContext<
  Config,
  NormalizedConfig,
  ExtendsHooksKey extends string,
> = AppContext<Config, NormalizedConfig> & {
  /** All hooks. */
  hooks: Hooks<Config, NormalizedConfig> &
    Record<ExtendsHooksKey, AsyncHook<(...args: any[]) => any>>;
  /** All plugin registry hooks */
  extendsHooks: Record<ExtendsHooksKey, AsyncHook<(...args: any[]) => any>>;
  /** Current App config. */
  config: Readonly<Config>;
  /** The normalized Rsbuild config. */
  normalizedConfig?: NormalizedConfig;
  pluginAPI?: CLIPluginAPI<Config, NormalizedConfig> &
    Record<string, (...args: any[]) => any>;
};
