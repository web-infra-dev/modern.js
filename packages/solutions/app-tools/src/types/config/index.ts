import type { ServerUserConfig, BffUserConfig } from '@modern-js/server-core';
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider';
import type {
  OutputUserConfig,
  RsOutputUserConfig,
  SharedOutputConfig,
} from './output';
import type {
  RsSourceUserConfig,
  SharedSourceConfig,
  SourceUserConfig,
} from './source';
import type { TestingUserConfig } from './testing';
import type { DevUserConfig } from './dev';
import type {
  RsToolsUserConfig,
  SharedToolsConfig,
  ToolsUserConfig,
} from './tools';
import type {
  HtmlUserConfig,
  RsHtmlUserConfig,
  SharedHtmlConfig,
} from './html';
import type { RsSecurityConfig, SecurityUserConfig } from './security';
import type { DeployUserConfig } from './deploy';
import type { ExperimentsUserConfig } from './experiments';
import type {
  PerformanceUserConfig,
  RsPerformanceConfig,
  SharedPerformanceConfig,
} from './performance';

export * from './output';

export interface RuntimeUserConfig {
  [name: string]: any;
}
export interface RuntimeByEntriesUserConfig {
  [name: string]: RuntimeUserConfig;
}

export type SharedUserConfig = {
  server?: ServerUserConfig;
  source?: SharedSourceConfig;
  output?: SharedOutputConfig;
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
  html?: SharedHtmlConfig;
  tools?: SharedToolsConfig;
  testing?: TestingUserConfig;
  builderPlugins?: BuilderPlugin[];
  performance?: SharedPerformanceConfig;
};

export interface AppToolsUserConfig extends SharedUserConfig {
  source?: SourceUserConfig;
  output?: OutputUserConfig;
  html?: HtmlUserConfig;
  tools?: ToolsUserConfig;
  security?: SecurityUserConfig;
  performance?: PerformanceUserConfig;
  experiments?: ExperimentsUserConfig;
}

export interface RsAppToolsUserConfig extends SharedUserConfig {
  source?: RsSourceUserConfig;
  output?: RsOutputUserConfig;
  html?: RsHtmlUserConfig;
  tools?: RsToolsUserConfig;
  performance?: RsPerformanceConfig;
  security?: RsSecurityConfig;
}

interface SharedNormalizedConfig<RawConfig> {
  cliOptions?: Record<string, any>;
  _raw: RawConfig;
}

export type AppToolsNormalizedConfig<Config = SharedUserConfig> =
  Required<Config> & SharedNormalizedConfig<Config>;
