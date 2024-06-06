import type {
  ServerUserConfig as LegacyServerUserConfig,
  BffUserConfig as LegacyBffUserConfig,
} from '@modern-js/server-core';
import type { DevUserLegacyConfig } from './dev';
import type { OutputLegacyUserConfig } from './output';
import type { SourceLegacyUserConfig } from './source';
import type { DeployLegacyUserConfig } from './deploy';
import type { ToolsLegacyUserConfig } from './tools';

export type { DevUserLegacyConfig } from './dev';
export type { OutputLegacyUserConfig } from './output';
export type { DeployLegacyUserConfig } from './deploy';
export type { SourceLegacyUserConfig } from './source';
export type { ToolsLegacyUserConfig } from './tools';

export interface RuntimeLegacyConfig {
  [name: string]: any;
}

export interface RuntimeByEntriesLegacyConfig {
  [name: string]: RuntimeLegacyConfig;
}

export type AppToolsLegacyUserConfig = {
  source?: SourceLegacyUserConfig;
  output?: OutputLegacyUserConfig;
  server?: LegacyServerUserConfig;
  dev?: DevUserLegacyConfig;
  deploy?: DeployLegacyUserConfig;
  tools?: ToolsLegacyUserConfig;
  runtime?: RuntimeLegacyConfig;
  runtimeByEntries?: RuntimeByEntriesLegacyConfig;
  bff?: LegacyBffUserConfig;
  legacy?: boolean;
};

export interface AppToolsLegacyNormalizedConfig
  extends Required<AppToolsLegacyUserConfig> {
  cliOptions?: Record<string, any>;
  _raw: AppToolsLegacyUserConfig;
}
