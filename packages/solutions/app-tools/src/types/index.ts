import type {
  CLIPlugin,
  CLIPluginExtends,
  RuntimePluginConfig,
  ServerPluginConfig,
} from '@modern-js/plugin-v2';
import type { AppToolsNormalizedConfig, AppToolsUserConfig } from './config';

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

export type AppUserConfig = AppToolsUserConfig;

export type AppNormalizedConfig = AppToolsNormalizedConfig;

export type {
  AppToolsExtendAPI,
  AppToolsExtendContext,
  AppToolsExtendHooks,
  AppToolsContext,
  AppToolsHooks as AppToolsFeatureHooks,
} from './new';
