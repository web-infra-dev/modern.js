import { BffNormalizedConfig, BffUserConfig } from './bff';
import { DevNormalizedConfig, DevUserConfig } from './dev';
import { HtmlNormalizedConfig, HtmlUserConfig } from './html';
import { OutputNormalizedConfig, OutputUserConfig } from './output';
import { SecurityNormalizedConfig, SecurityUserConfig } from './security';
import { ServerNormalizedConfig, ServerUserConfig } from './server';
import { SourceNormalizedConfig, SourceUserConfig } from './source';
import { ToolsNormalizedConfig, ToolsUserConfig } from './tools';

export * from './bff';
export * from './html';
export * from './output';
export * from './server';
export * from './source';
export * from './tools';

interface RuntimeUserConfig {
  [property: string]: any;
}
type RuntimeNormalizedConfig = RuntimeUserConfig;

export interface UserConfig {
  output?: OutputUserConfig;
  source?: SourceUserConfig;
  tools?: ToolsUserConfig;
  server?: ServerUserConfig;
  runtime?: RuntimeUserConfig;
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
  runtime: RuntimeNormalizedConfig;
  html: HtmlNormalizedConfig;
  bff: BffNormalizedConfig;
  dev?: DevNormalizedConfig;
  security?: SecurityNormalizedConfig;
};

export type CliConfig = Required<UserConfig>;
