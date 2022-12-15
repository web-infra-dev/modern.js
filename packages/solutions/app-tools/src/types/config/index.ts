import type { UserConfig } from '@modern-js/core';
import type {
  ServerUserConfig,
  ServerNormalizedConfig,
  BffUserConfig,
  BffNormalizedConfig,
} from '@modern-js/server-core';
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';
import type { AppToolsHooks } from '../hooks';
import type { OutputNormalizedConfig, OutputUserConfig } from './output';
import type { SourceNormalizedConfig, SourceUserConfig } from './source';
import type { DevNormalizedConfig, DevUserConfig } from './dev';
import type { ToolsNormalizedConfig, ToolsUserConfig } from './tools';
import type { HtmlNormalizedConfig, HtmlUserConfig } from './html';
import type { SecurityNormalizedConfig, SecurityUserConfig } from './security';
import type { DeployNormalizedConfig, DeployUserConfig } from './deploy';
import type {
  ExperimentsUserConfig,
  ExperimentsNormalizedConfig,
} from './experiments';
import type {
  PerformanceNormalizedConfig,
  PerformanceUserConfig,
} from './performance';

export * from './output';

export interface RuntimeUserConfig {
  [name: string]: any;
}
export interface RuntimeByEntriesUserConfig {
  [name: string]: RuntimeUserConfig;
}
export type RuntimeNormalizedConfig = RuntimeUserConfig;
export type RuntimeByEntriesNormalizedConfig = RuntimeByEntriesUserConfig;

export interface AppToolsUserConfig {
  source?: SourceUserConfig;
  output?: OutputUserConfig;
  server?: ServerUserConfig;
  dev?: DevUserConfig;
  deploy?: DeployUserConfig;
  html?: HtmlUserConfig;
  tools?: ToolsUserConfig;
  runtime?: RuntimeUserConfig;
  security?: SecurityUserConfig;
  runtimeByEntries?: RuntimeByEntriesUserConfig;
  performance?: PerformanceUserConfig;
  experiments?: ExperimentsUserConfig;
  builderPlugins?: BuilderPlugin[];
  /**
   * The configuration of `bff` is provided by `bff` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `bff` plugin
   */
  bff?: BffUserConfig;
}

export type AppToolsNormalizedConfig = {
  source: SourceNormalizedConfig;
  bff: BffNormalizedConfig;
  dev: DevNormalizedConfig;
  deploy: DeployNormalizedConfig;
  html: HtmlNormalizedConfig;
  runtime: RuntimeNormalizedConfig;
  runtimeByEntries: RuntimeByEntriesNormalizedConfig;
  output: OutputNormalizedConfig;
  security: SecurityNormalizedConfig;
  server: ServerNormalizedConfig;
  tools: ToolsNormalizedConfig;
  performance: PerformanceNormalizedConfig;
  experiments: ExperimentsNormalizedConfig;
  builderPlugins: BuilderPlugin[];

  cliOptions?: Record<string, any>;
  _raw: UserConfig<{
    hooks: AppToolsHooks;
    userConfig: AppToolsUserConfig;
    normalizedConfig: AppToolsNormalizedConfig;
  }>;
};
