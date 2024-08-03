import type { NormalizedConfig, UserConfig } from '@modern-js/core';
import type { AppToolsUserConfig, AppToolsNormalizedConfig } from './config';
import type { AppToolsHooks } from './hooks';
import type {
  AppToolsLegacyUserConfig,
  AppToolsLegacyNormalizedConfig,
} from './legacyConfig';
import { Bundler } from './utils';

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

export type AppTools<B extends Bundler = 'webpack'> = {
  hooks: AppToolsHooks<B>;
  userConfig: AppToolsUserConfig<B>;
  normalizedConfig: AppToolsNormalizedConfig<AppToolsUserConfig<'shared'>>;
};

export type LegacyAppTools = {
  hooks: AppToolsHooks;
  userConfig: AppToolsLegacyUserConfig;
  normalizedConfig: AppToolsLegacyNormalizedConfig;
};

export type AppNormalizedConfig<B extends Bundler = 'webpack'> =
  NormalizedConfig<AppTools<B>>;
export type AppLegacyNormalizedConfig = NormalizedConfig<LegacyAppTools>;

export type AppUserConfig<B extends Bundler = 'webpack'> = UserConfig<
  AppTools<B>
>;
export type AppLegacyUserConfig = UserConfig<LegacyAppTools>;
