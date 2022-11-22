import { CliNormalizedConfig, CliUserConfig } from '@modern-js/core';
import { UserConfig as ModuleToolsUserConfig } from './config';
import { ModuleToolsHooks } from './hooks';

export * from './hooks';
export * from './command';
export * from './config';
export * from './dts';
export * from './context';
export type {
  CliPlugin,
  CliNormalizedConfig,
  CliUserConfig,
  IAppContext,
  PluginAPI,
} from '@modern-js/core';

export type ModuleTools = {
  hooks: ModuleToolsHooks;
  userConfig: ModuleToolsUserConfig;
  normalizedConfig: Required<ModuleToolsUserConfig>;
};

export type NormalizedConfig = CliNormalizedConfig<ModuleTools>;
export type UserConfig = CliUserConfig<ModuleTools>;
