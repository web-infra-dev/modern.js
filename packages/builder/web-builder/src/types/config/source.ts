import type { ChainedConfig, JSONValue } from '../utils';
import type { WebpackAlias } from '../thirdParty';

export interface SourceConfig {
  alias?: ChainedConfig<WebpackAlias>;
  preEntry?: string | string[];
  globalVars?: Record<string, JSONValue>;
  resolveExtensionPrefix?: string;
}

export interface SourceFinalConfig {
  preEntry?: string | string[];
  resolveExtensionPrefix?: string;
}
