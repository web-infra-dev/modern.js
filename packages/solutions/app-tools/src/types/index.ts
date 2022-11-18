import type { AppToolsUserConfig, AppToolsNormalizedConfig } from './config';
import type { AppToolsHooks } from './hooks';
import {
  LegacyAppToolsNormalizedConfig,
  LegacyAppToolsUserConfig,
} from './legacyConfig';

export * from './config';
export * from './hooks';
export * from './legacyConfig';
export type {
  CliPlugin,
  CliNormalizedConfig,
  IAppContext,
  PluginAPI,
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
