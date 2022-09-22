import type { ChainedConfig, JSONValue } from '../utils';
import type { WebpackAlias } from '../thirdParty';

export type ModuleScopes = Array<string | RegExp>;

export interface SourceConfig {
  alias?: ChainedConfig<WebpackAlias>;
  preEntry?: string | string[];
  globalVars?: Record<string, JSONValue>;
  moduleScopes?: ChainedConfig<ModuleScopes>;
  compileJsDataURI?: boolean;
  resolveExtensionPrefix?: string;
}

export interface FinalSourceConfig extends SourceConfig {
  preEntry: string[];
}
