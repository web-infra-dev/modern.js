import type { BffUserConfig, ServerUserConfig } from '@modern-js/server-core';
import type {
  LooseRsbuildPlugin,
  UniBuilderPlugin,
} from '@modern-js/uni-builder';
import type { RsbuildConfig } from '@rsbuild/core';
import type { Bundler } from '../utils';
import type { DeployUserConfig } from './deploy';
import type { DevUserConfig } from './dev';
import type { ExperimentsUserConfig } from './experiments';
import type { HtmlUserConfig } from './html';
import type { OutputUserConfig } from './output';
import type { PerformanceUserConfig } from './performance';
import type { SecurityUserConfig } from './security';
import type { SourceUserConfig } from './source';
import type { TestingUserConfig } from './testing';
import type { ToolsUserConfig } from './tools';

export * from './output';

export interface RuntimeUserConfig {
  [name: string]: any;
}
export interface RuntimeByEntriesUserConfig {
  [name: string]: RuntimeUserConfig;
}

export interface AppToolsUserConfig<B extends Bundler> {
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
  runtime?: RuntimeUserConfig;
  runtimeByEntries?: RuntimeByEntriesUserConfig;
  html?: HtmlUserConfig;
  tools?: ToolsUserConfig<B>;
  security?: SecurityUserConfig;
  testing?: TestingUserConfig;
  builderPlugins?: Array<LooseRsbuildPlugin | UniBuilderPlugin>;
  performance?: PerformanceUserConfig;
  devtools?: any;
  environments?: RsbuildConfig['environments'];
}

interface SharedNormalizedConfig<RawConfig> {
  cliOptions?: Record<string, any>;
  _raw: RawConfig;
}

export type AppToolsNormalizedConfig<Config = AppToolsUserConfig<'shared'>> =
  Required<Config> & SharedNormalizedConfig<Config>;
