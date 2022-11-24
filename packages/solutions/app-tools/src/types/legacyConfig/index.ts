import type {
  ServerUserConfig as LegacyServerUserConfig,
  BffUserConfig as LegacyBffUserConfig,
} from '@modern-js/server-core';
import type { LegacyDevUserConfig } from './dev';
import type { LegacyOutputUserConfig } from './output';
import type { LegacySourceUserConfig } from './source';
import type { LegacyDeployUserConfig } from './deploy';
import type { LegacyToolsUserConfig } from './tools';

export type { LegacyDevUserConfig } from './dev';
export type { LegacyOutputUserConfig } from './output';
export type { LegacyDeployUserConfig } from './deploy';
export type { LegacySourceUserConfig } from './source';
export type { LegacyToolsUserConfig } from './tools';

export interface LegacyRuntimeConfig {
  [name: string]: any;
}

export interface LegacyRuntimeByEntriesConfig {
  [name: string]: LegacyRuntimeConfig;
}

export type LegacyAppToolsUserConfig = {
  source?: LegacySourceUserConfig;
  output?: LegacyOutputUserConfig;
  server?: LegacyServerUserConfig;
  dev?: LegacyDevUserConfig;
  deploy?: LegacyDeployUserConfig;
  tools?: LegacyToolsUserConfig;
  runtime?: LegacyRuntimeConfig;
  runtimeByEntries?: LegacyRuntimeByEntriesConfig;
  bff?: LegacyBffUserConfig;
  legacy?: boolean;
};

export interface LegacyAppToolsNormalizedConfig
  extends Required<LegacyAppToolsUserConfig> {
  cliOptions?: Record<string, any>;
  _raw: LegacyAppToolsUserConfig;
}
