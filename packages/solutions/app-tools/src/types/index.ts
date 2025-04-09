import type { AsyncSetup, PluginOptions } from '@modern-js/plugin';
import type {
  CLIPlugin,
  CLIPluginExtends,
  RuntimePluginConfig,
  ServerPluginConfig,
} from '@modern-js/plugin-v2';
import type { AppToolsNormalizedConfig, AppToolsUserConfig } from './config';
import type { AppToolsHooks } from './hooks';
import type {
  AppToolsLegacyNormalizedConfig,
  AppToolsLegacyUserConfig,
} from './legacyConfig';
import type {
  AppToolsContext,
  AppToolsExtendAPI,
  AppToolsExtendContext,
  AppToolsExtendHooks,
} from './new';
import type { Bundler } from './utils';

export type { CLIPluginExtends, RuntimePluginConfig, ServerPluginConfig };
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

// 同时支持 plugin and plugin v2
export type AppTools<B extends Bundler = 'webpack'> = Required<
  CLIPluginExtends<
    AppToolsUserConfig<B>,
    AppToolsNormalizedConfig,
    AppToolsExtendContext<B>,
    AppToolsExtendAPI<B>,
    AppToolsExtendHooks
  >
> & {
  // v1 params
  userConfig: AppToolsUserConfig<B>;
  hooks: AppToolsHooks<B>;
};

export type LegacyAppTools = {
  hooks: AppToolsHooks;
  userConfig: AppToolsLegacyUserConfig;
  normalizedConfig: AppToolsLegacyNormalizedConfig;
};

/** old plugins */
export type CliPlugin<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
  } = {},
  ExtendHooks extends Record<string, any> = {},
  ExtendUserConfig extends Record<string, any> = {},
  ExtendNormalizedConfig extends Record<string, any> = {},
> = PluginOptions<
  BaseHooks<Extends>,
  AsyncSetup<BaseHooks<Extends> & Extends['hooks'], BasePluginAPI<Extends>>,
  Extends['hooks']
>;

// plugin v2
export type CliPluginFuture<Extends extends CLIPluginExtends> =
  CLIPlugin<Extends>;

export type AppNormalizedConfig<B extends Bundler = 'webpack'> =
  AppToolsNormalizedConfig<AppToolsUserConfig<B>> & {
    plugins?: CliPluginFuture<AppTools<B>>[];
    autoLoadPlugins?: boolean;
  };
export type AppLegacyNormalizedConfig = AppToolsLegacyNormalizedConfig & {
  plugins?: any[];
  autoLoadPlugins?: boolean;
};

export type AppUserConfig<B extends Bundler = 'webpack'> =
  AppToolsUserConfig<B> & { plugins?: any[]; autoLoadPlugins?: boolean };
export type AppLegacyUserConfig = AppToolsLegacyUserConfig & {
  plugins?: any[];
  autoLoadPlugins?: boolean;
};
export type UserConfig<B extends Bundler = 'webpack'> = AppUserConfig<B>;
export type NormalizedConfig<B extends Bundler = 'webpack'> =
  | AppNormalizedConfig<B>
  | AppLegacyNormalizedConfig;
export type IAppContext = AppToolsContext<'shared'>;
export type AppToolsOptions = {
  /**
   * Specify which bundler to use for the build.
   * @default `webpack`
   * */
  bundler?: 'rspack' | 'webpack' | 'experimental-rspack';
};

export type {
  AppToolsExtendAPI,
  AppToolsExtendContext,
  AppToolsExtendHooks,
  AppToolsContext,
  AppToolsHooks as AppToolsFeatureHooks,
} from './new';
