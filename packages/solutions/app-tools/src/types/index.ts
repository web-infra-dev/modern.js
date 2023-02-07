import type { NormalizedConfig, UserConfig } from '@modern-js/core';
import type {
  AppToolsUserConfig,
  AppToolsNormalizedConfig,
  SharedUserConfig,
  RsAppToolsUserConfig,
} from './config';
import type { AppToolsHooks } from './hooks';
import type {
  AppToolsLegacyUserConfig,
  AppToolsLegacyNormalizedConfig,
} from './legacyConfig';
import { Bundler, FromConfig } from './utils';

export * from './hooks';
export * from './config';
export * from './legacyConfig';
export type { Bundler } from './utils';
export type {
  ServerUserConfig,
  ServerNormalizedConfig,
  BffUserConfig,
  BffNormalizedConfig,
  SSR,
  SSRByEntries,
} from '@modern-js/server-core';
export type {
  IAppContext,
  PluginAPI,
  CliPlugin,
  NormalizedConfig,
  UserConfig,
} from '@modern-js/core';

export type AppTools<B extends Bundler = 'webpack'> = {
  hooks: AppToolsHooks;
  userConfig: FromConfig<
    B,
    {
      rspack: RsAppToolsUserConfig;
      webpack: AppToolsUserConfig;
      shared: SharedUserConfig;
    }
  >;
  normalizedConfig: FromConfig<
    B,
    {
      rspack: AppToolsNormalizedConfig<RsAppToolsUserConfig>;
      webpack: AppToolsNormalizedConfig<AppToolsUserConfig>;
      shared: AppToolsNormalizedConfig<SharedUserConfig>;
    }
  >;
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
