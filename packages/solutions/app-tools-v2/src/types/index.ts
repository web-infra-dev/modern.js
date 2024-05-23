import type { NormalizedConfig, UserConfig } from '@modern-js/core';
import type { Bundler } from './utils';
import type { AppToolsHooks } from './hooks';
import type { AppToolsUserConfig, AppToolsNormalizedConfig } from './config';

export type { Bundler } from './utils';
export type { PluginAPI } from '@modern-js/core';

export type AppTools<B extends Bundler = 'webpack'> = {
  hooks: AppToolsHooks<B>;
  userConfig: AppToolsUserConfig<B>;
  normalizedConfig: AppToolsNormalizedConfig<AppToolsUserConfig<'shared'>>;
};

export type { UserConfig } from '@modern-js/core';

export type AppNormalizedConfig<B extends Bundler = 'webpack'> =
  NormalizedConfig<AppTools<B>>;

export type AppUserConfig<B extends Bundler = 'webpack'> = UserConfig<
  AppTools<B>
>;
