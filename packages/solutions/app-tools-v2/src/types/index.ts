import type { NormalizedConfig, UserConfig } from '@modern-js/core';
import type { Bundler } from './utils';
import type { AppToolsUserConfig, AppToolsNormalizedConfig } from './config';
import type { AppToolsHooks } from './hooks';
import type {
  AppToolsLegacyUserConfig,
  AppToolsLegacyNormalizedConfig,
} from './legacyConfig';

export * from './config';
export type { Bundler } from './utils';
export type { IAppContext, PluginAPI } from '@modern-js/core';

export type AppTools<B extends Bundler = 'webpack'> = {
  hooks: AppToolsHooks<B>;
  userConfig: AppToolsUserConfig<B>;
  normalizedConfig: AppToolsNormalizedConfig<AppToolsUserConfig<'shared'>>;
};

export type { CliPlugin, UserConfig } from '@modern-js/core';

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
