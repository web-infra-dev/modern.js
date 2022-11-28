import { NormalizedConfig, UserConfig } from '@modern-js/core';
import { UserConfig as ModuleToolsUserConfig } from './config';
import { ModuleToolsHooks } from './hooks';

export * from './hooks';
export * from './command';
export * from './config';
export * from './dts';
export * from './context';
export type {
  CliPlugin,
  NormalizedConfig,
  // FIXME: conflict with ModuleTools.config export type: `UserConfig`
  // UserConfig,
  IAppContext,
  PluginAPI,
} from '@modern-js/core';

export type ModuleTools = {
  hooks: ModuleToolsHooks;
  userConfig: ModuleToolsUserConfig;
  normalizedConfig: Required<ModuleToolsUserConfig>;
};

export type ModuleNormalizedConfig = NormalizedConfig<ModuleTools>;
export type ModuleUserConfig = UserConfig<ModuleTools>;
