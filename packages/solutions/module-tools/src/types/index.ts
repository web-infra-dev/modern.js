import { NormalizedConfig, UserConfig } from '@modern-js/core';
import { ModuleToolsHooks } from './hooks';
import { ModuleExtraConfig } from './config';
import type {
  ModuleToolsLegacyUserConfig,
  ModuleToolsLegacyNormalizedConfig,
} from './legacyConfig';

export * from './hooks';
export * from './command';
export * from './config';
export * from './legacyConfig';
export * from './dts';
export * from './context';
export type { CliPlugin, IAppContext, PluginAPI } from '@modern-js/core';

export type ModuleTools = {
  hooks: ModuleToolsHooks;
  userConfig: ModuleExtraConfig;
  normalizedConfig: Required<ModuleExtraConfig>;
};
export type LegacyModuleTools = {
  hooks: ModuleToolsHooks;
  userConfig: ModuleToolsLegacyUserConfig;
  normalizedConfig: ModuleToolsLegacyNormalizedConfig;
};

export type ModuleUserConfig = UserConfig<ModuleTools>;
export type ModuleLegacyUserConfig = UserConfig<LegacyModuleTools>;

export type ModuleNormalizedConfig = NormalizedConfig<ModuleTools>;
export type ModuleLegacyNormalizedConfig = NormalizedConfig<LegacyModuleTools>;

// params type for defineConfig
export type ModuleConfigParams =
  | ModuleUserConfig
  | Promise<ModuleUserConfig>
  | ((env: any) => ModuleUserConfig | Promise<ModuleUserConfig>);
