import type { ChainedConfig, JSONValue } from '../utils';
import type { WebpackAlias } from '../thirdParty';
import type * as webpack from 'webpack';

export type ModuleScopes = Array<string | RegExp>;
export type CodeValue = webpack.DefinePlugin['definitions'][string];

export interface SourceConfig {
  alias?: ChainedConfig<WebpackAlias>;
  preEntry?: string | string[];
  globalVars?: Record<string, JSONValue>;
  define?: Record<string, CodeValue>;
  moduleScopes?: ChainedConfig<ModuleScopes>;
  compileJsDataURI?: boolean;
  resolveExtensionPrefix?: string;
}

export interface SourceFinalConfig {
  preEntry?: string | string[];
  resolveExtensionPrefix?: string;
}
