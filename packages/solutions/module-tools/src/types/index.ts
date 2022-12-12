import { NormalizedConfig, UserConfig } from '@modern-js/core';
import { ModuleToolsHooks } from './hooks';
import { ModuleExtraConfig } from './config';

export * from './hooks';
export * from './command';
export * from './config';
export * from './dts';
export * from './context';
export type { CliPlugin, IAppContext, PluginAPI } from '@modern-js/core';

export type ModuleTools = {
  hooks: ModuleToolsHooks;
  userConfig: ModuleExtraConfig;
  normalizedConfig: Required<ModuleExtraConfig>;
};

export type ModuleUserConfig = UserConfig<ModuleTools>;

export type ModuleNormalizedConfig = NormalizedConfig<ModuleTools>;

// params type for defineConfig
export type ModuleConfigParams =
  | ModuleUserConfig
  | Promise<ModuleUserConfig>
  | ((env: any) => ModuleUserConfig | Promise<ModuleUserConfig>);
