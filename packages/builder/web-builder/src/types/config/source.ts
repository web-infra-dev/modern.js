import type { ChainedConfig, JSONValue } from '../utils';
import type { WebpackAlias } from '../thirdParty';

export type ModuleScopes = Array<string | RegExp>;

export interface SourceConfig {
  alias?: ChainedConfig<WebpackAlias>;
  preEntry?: string | string[];
  globalVars?: Record<string, JSONValue>;
  moduleScopes?: ChainedConfig<ModuleScopes>;
  resolveExtensionPrefix?: string;
}

export interface SourceFinalConfig {
  preEntry?: string | string[];
  resolveExtensionPrefix?: string;
}
