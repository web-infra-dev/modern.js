import type { NormalizedConfig, UserConfig } from '@modern-js/core';
import type { AppToolsUserConfig, AppToolsNormalizedConfig } from './config';
import type { AppToolsHooks } from './hooks';
import type {
  AppToolsLegacyUserConfig,
  AppToolsLegacyNormalizedConfig,
} from './legacyConfig';

export * from './hooks';
export * from './config';
export * from './legacyConfig';
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

export type AppTools = {
  hooks: AppToolsHooks;
  userConfig: AppToolsUserConfig;
  normalizedConfig: AppToolsNormalizedConfig;
};

export type LegacyAppTools = {
  hooks: AppToolsHooks;
  userConfig: AppToolsLegacyUserConfig;
  normalizedConfig: AppToolsLegacyNormalizedConfig;
};

export type AppNormalizedConfig = NormalizedConfig<AppTools>;
export type AppLegacyNormalizedConfig = NormalizedConfig<LegacyAppTools>;

export type AppUserConfig = UserConfig<AppTools>;
export type AppLegacyUserConfig = UserConfig<LegacyAppTools>;
