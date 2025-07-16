import type { NormalizedConfig, UserConfig } from '@modern-js/core';
import type {
  CLIPlugin,
  CLIPluginExtends,
  RuntimePluginConfig,
  ServerPluginConfig,
} from '@modern-js/plugin-v2';
import type { AppToolsNormalizedConfig, AppToolsUserConfig } from './config';
import type { AppToolsHooks } from './hooks';
import type {
  AppToolsExtendAPI,
  AppToolsExtendContext,
  AppToolsExtendHooks,
} from './new';

export type { CLIPluginExtends, RuntimePluginConfig, ServerPluginConfig };
export * from './hooks';
export * from './config';
export type { webpack, Rspack } from '@modern-js/uni-builder';
export type {
  ServerUserConfig,
  ServerNormalizedConfig,
  BffUserConfig,
  BffNormalizedConfig,
  SSR,
  SSRByEntries,
  // render request handler
  Resource,
  Params,
  RequestHandlerConfig,
  LoaderContext,
  OnError,
  OnTiming,
  RequestHandlerOptions,
  RequestHandler,
} from '@modern-js/server-core';
export type {
  IAppContext,
  PluginAPI,
  CliPlugin,
  NormalizedConfig,
  UserConfig,
} from '@modern-js/core';

// 同时支持 plugin and plugin v2
export type AppTools = Required<
  CLIPluginExtends<
    AppToolsUserConfig,
    AppToolsNormalizedConfig,
    AppToolsExtendContext,
    AppToolsExtendAPI,
    AppToolsExtendHooks
  >
> & {
  // v1 params
  userConfig: AppToolsUserConfig;
  hooks: AppToolsHooks;
};

// plugin v2
export type CliPluginFuture<Extends extends CLIPluginExtends> =
  CLIPlugin<Extends>;

export type AppNormalizedConfig = NormalizedConfig<AppTools>;

export type AppUserConfig = UserConfig<AppTools>;

export type {
  AppToolsExtendAPI,
  AppToolsExtendContext,
  AppToolsExtendHooks,
  AppToolsContext,
  AppToolsHooks as AppToolsFeatureHooks,
} from './new';
