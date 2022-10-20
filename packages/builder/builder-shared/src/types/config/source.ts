import type { ChainedConfig, JSONValue } from '../utils';

export type Alias = {
  [index: string]: string | false | string[];
};

export type ModuleScopes = Array<string | RegExp>;

export interface SharedSourceConfig {
  include?: (string | RegExp)[];
  alias?: ChainedConfig<Alias>;
  preEntry?: string | string[];
  globalVars?: Record<string, JSONValue>;
  define?: Record<string, any>;
  moduleScopes?: ChainedConfig<ModuleScopes>;
  compileJsDataURI?: boolean;
  resolveExtensionPrefix?: string;
  resolveMainFields?: (string[] | string)[];
}

export interface NormalizedSharedSourceConfig extends SharedSourceConfig {
  preEntry: string[];
  globalVars: Record<string, JSONValue>;
  define: Record<string, any>;
  compileJsDataURI: boolean;
}
