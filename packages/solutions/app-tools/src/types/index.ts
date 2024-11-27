import type { NormalizedConfig, UserConfig } from '@modern-js/core';
import type { CLIPlugin } from '@modern-js/plugin-v2/types';
import type { AppToolsNormalizedConfig, AppToolsUserConfig } from './config';
import type { AppToolsHooks } from './hooks';
import type {
  AppToolsLegacyNormalizedConfig,
  AppToolsLegacyUserConfig,
} from './legacyConfig';
import type {
  AppToolsExtendAPI,
  AppToolsExtendContext,
  AppToolsExtendHooks,
} from './new';
import type { Bundler } from './utils';

export * from './hooks';
export * from './config';
export * from './legacyConfig';
export type { webpack, Rspack } from '@modern-js/uni-builder';
export type { Bundler } from './utils';
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
export type AppTools<B extends Bundler = 'webpack'> = {
  // common
  normalizedConfig: AppToolsNormalizedConfig;
  // v1
  userConfig: AppToolsUserConfig<B>;
  hooks: AppToolsHooks<B>;
  // v2
  config: AppToolsUserConfig<B>;
  extendsHooks: AppToolsExtendHooks;
  extendApi: AppToolsExtendAPI<B>;
  extendContext: AppToolsExtendContext;
};

export type LegacyAppTools = {
  hooks: AppToolsHooks;
  userConfig: AppToolsLegacyUserConfig;
  normalizedConfig: AppToolsLegacyNormalizedConfig;
};

// plugin v2
export type AppToolsPlugin = CLIPlugin<AppTools>;

export type AppNormalizedConfig<B extends Bundler = 'webpack'> =
  NormalizedConfig<AppTools<B>>;
export type AppLegacyNormalizedConfig = NormalizedConfig<LegacyAppTools>;

export type AppUserConfig<B extends Bundler = 'webpack'> = UserConfig<
  AppTools<B>
>;
export type AppLegacyUserConfig = UserConfig<LegacyAppTools>;

export type AppToolsOptions = {
  /**
   * Specify which bundler to use for the build.
   * @default `webpack`
   * */
  bundler?: 'rspack' | 'webpack' | 'experimental-rspack';
};
