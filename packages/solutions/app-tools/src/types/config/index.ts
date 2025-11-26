import type { RsbuildPlugin } from '@modern-js/builder';
import type { CLIPlugin, CLIPluginExtends } from '@modern-js/plugin';
import type { BffUserConfig, ServerUserConfig } from '@modern-js/server-core';
import type { RsbuildConfig } from '@rsbuild/core';
import type {
  AppToolsExtendAPI,
  AppToolsExtendContext,
  AppToolsExtendHooks,
} from '../plugin';
import type { DeployUserConfig } from './deploy';
import type { DevUserConfig } from './dev';
import type { ExperimentsUserConfig } from './experiments';
import type { HtmlUserConfig } from './html';
import type { OutputUserConfig } from './output';
import type { PerformanceUserConfig } from './performance';
import type { ResolveUserConfig } from './resolve';
import type { SecurityUserConfig } from './security';
import type { SourceUserConfig } from './source';
import type { TestingUserConfig } from './testing';
import type { ToolsUserConfig } from './tools';

export * from './output';

export interface AppToolsUserConfig {
  resolve?: ResolveUserConfig;
  server?: ServerUserConfig;
  source?: SourceUserConfig;
  output?: OutputUserConfig;
  experiments?: ExperimentsUserConfig;
  /**
   * The configuration of `bff` is provided by `bff` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `bff` plugin
   */
  bff?: BffUserConfig;
  dev?: DevUserConfig;
  deploy?: DeployUserConfig;
  html?: HtmlUserConfig;
  tools?: ToolsUserConfig;
  security?: SecurityUserConfig;
  testing?: TestingUserConfig;
  builderPlugins?: Array<RsbuildPlugin>;
  performance?: PerformanceUserConfig;
  environments?: RsbuildConfig['environments'];
  plugins?: CliPlugin<AppTools>[];
}

interface SharedNormalizedConfig<RawConfig> {
  cliOptions?: Record<string, any>;
  _raw: RawConfig;
}

export type AppToolsNormalizedConfig<Config = AppToolsUserConfig> =
  Required<Config> & SharedNormalizedConfig<Config>;

export type AppTools = Required<
  CLIPluginExtends<
    AppToolsUserConfig,
    AppToolsNormalizedConfig,
    AppToolsExtendContext,
    AppToolsExtendAPI,
    AppToolsExtendHooks
  >
>;

export type CliPlugin<Extends extends CLIPluginExtends> = CLIPlugin<Extends>;
