import { LegacyDevUserConfig } from './dev';
import { LegacyOutputUserConfig } from './output';
import { LegacyServerUserConfig } from './server';
import { LegacySourceUserConfig } from './source';
import { LegacyDeployUserConfig } from './deploy';
import { LegacyToolsUserConfig } from './tools';
import { LegacyBffConfig } from './bff';

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
  bff?: LegacyBffConfig;
};

export interface LegacyAppToolsNormalizedConfig
  extends Required<LegacyAppToolsUserConfig> {
  cliOptions?: Record<string, any>;
  _raw: LegacyAppToolsUserConfig;
}
