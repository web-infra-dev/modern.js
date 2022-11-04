import type { ChainedConfig, JSONValue } from '@modern-js/builder-shared';
import type { WebpackAlias } from '../thirdParty';
import type * as webpack from 'webpack';

export type ModuleScopes = Array<string | RegExp>;
export type CodeValue = webpack.DefinePlugin['definitions'][string];

export interface SourceConfig {
  include?: (string | RegExp)[];
  alias?: ChainedConfig<WebpackAlias>;
  preEntry?: string | string[];
  globalVars?: Record<string, JSONValue>;
  define?: Record<string, CodeValue>;
  moduleScopes?: ChainedConfig<ModuleScopes>;
  compileJsDataURI?: boolean;
  resolveExtensionPrefix?: string;
  resolveMainFields?: (string[] | string)[];
}

export interface SourceFinalConfig {
  preEntry?: string | string[];
  resolveExtensionPrefix?: string;
}

export interface NormalizedSourceConfig extends SourceConfig {
  preEntry: string[];
  globalVars: Record<string, JSONValue>;
  define: Record<string, CodeValue>;
  compileJsDataURI: boolean;
}
