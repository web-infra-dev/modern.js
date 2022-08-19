import type { JSONValue } from '../utils';
import type { WebpackAlias } from '../thirdParty';

export interface SourceConfig {
  alias?: WebpackAlias | ((alias: WebpackAlias) => WebpackAlias | void);
  preEntry?: string | string[];
  globalVars?: Record<string, JSONValue>;
  resolveExtensionPrefix?: string;
}

export interface SourceFinalConfig {
  preEntry?: string | string[];
  resolveExtensionPrefix?: string;
}
