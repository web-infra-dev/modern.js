import { CliNormalizedConfig, CliUserConfig, PluginAPI } from '@modern-js/core';
import type { AppToolsUserConfig, AppToolsNormalizedConfig } from './config';
import type { AppToolsHooks } from './hooks';
import type {
  LegacyAppToolsNormalizedConfig,
  LegacyAppToolsUserConfig,
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
  CliNormalizedConfig,
  CliUserConfig,
} from '@modern-js/core';

export type AppTools = {
  hooks: AppToolsHooks;
  userConfig: AppToolsUserConfig;
  normalizedConfig: AppToolsNormalizedConfig;
};

export type LegacyAppTools = {
  hooks: AppToolsHooks;
  userConfig: LegacyAppToolsUserConfig;
  normalizedConfig: LegacyAppToolsNormalizedConfig;
};

export type NormalizedConfig = CliNormalizedConfig<AppTools>;
export type LegacyNormalizedConfig = CliNormalizedConfig<LegacyAppTools>;

export type UserConfig = CliUserConfig<AppTools>;
export type LegacyUserConfig = CliUserConfig<LegacyAppTools>;
export type LegacyPluginAPI = PluginAPI<LegacyAppTools>;
