import type { BffNormalizedConfig, BffUserConfig } from './bff';
import type { DevNormalizedConfig, DevUserConfig } from './dev';
import type { HtmlNormalizedConfig, HtmlUserConfig } from './html';
import type { OutputNormalizedConfig, OutputUserConfig } from './output';
import type { SecurityNormalizedConfig, SecurityUserConfig } from './security';
import type { ServerNormalizedConfig, ServerUserConfig } from './server';
import type { SourceNormalizedConfig, SourceUserConfig } from './source';
import type { ToolsNormalizedConfig, ToolsUserConfig } from './tools';

export * from './bff';
export * from './html';
export * from './output';
export * from './server';
export * from './source';
export * from './tools';

export interface UserConfig {
  output?: OutputUserConfig;
  source?: SourceUserConfig;
  tools?: ToolsUserConfig;
  server?: ServerUserConfig;
  html?: HtmlUserConfig;
  bff?: BffUserConfig;
  dev?: DevUserConfig;
  security?: SecurityUserConfig;
}

export type ServerOptions = {
  output: OutputNormalizedConfig;
  source: SourceNormalizedConfig;
  tools: ToolsNormalizedConfig;
  server: ServerNormalizedConfig;
  html: HtmlNormalizedConfig;
  bff: BffNormalizedConfig;
  dev?: DevNormalizedConfig;
  security?: SecurityNormalizedConfig;
};

export type CliConfig = Required<UserConfig>;
