import type { JSONValue } from '../utils';

export interface SourceConfig {
  preEntry?: string | string[];
  resolveExtensionPrefix?: string;
  globalVars?: Record<string, JSONValue>;
}

export interface SourceFinalConfig {
  preEntry?: string | string[];
  resolveExtensionPrefix?: string;
}
