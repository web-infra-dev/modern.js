import { UserConfig, ResolvedConfig } from './config';
import { ModuleToolsHooks } from './hooks';

export * from './hooks';
export * from './command';
export * from './config';
export * from './dts';
export * from './context';
export type {
  CliPlugin,
  CliNormalizedConfig,
  IAppContext,
  PluginAPI,
} from '@modern-js/core';

export type ModuleTools = {
  hooks: ModuleToolsHooks;
  userConfig: UserConfig;
  normalizedConfig: ResolvedConfig;
};
