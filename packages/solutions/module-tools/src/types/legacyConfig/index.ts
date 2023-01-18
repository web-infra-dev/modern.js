import type { OutputLegacyUserConfig } from './output';
import type { SourceLegacyUserConfig } from './source';

import type { ToolsLegacyUserConfig } from './tools';

export type { OutputLegacyUserConfig } from './output';

export type { SourceLegacyUserConfig } from './source';
export type { ToolsLegacyUserConfig } from './tools';

export interface RuntimeLegacyConfig {
  [name: string]: any;
}

export interface RuntimeByEntriesLegacyConfig {
  [name: string]: RuntimeLegacyConfig;
}

export type ModuleToolsLegacyUserConfig = {
  source?: SourceLegacyUserConfig;
  output?: OutputLegacyUserConfig;
  tools?: ToolsLegacyUserConfig;
  runtime?: RuntimeLegacyConfig;
  legacy?: boolean;
};

export type ModuleToolsLegacyNormalizedConfig =
  Required<ModuleToolsLegacyUserConfig>;
