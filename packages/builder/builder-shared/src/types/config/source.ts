import type { Alias } from '@modern-js/utils';
import type { ChainedConfig, JSONValue } from '../utils';

export type ModuleScopes = Array<string | RegExp>;

export interface SharedSourceConfig {
  /**
   * Create aliases to import or require certain modules,
   * same as the [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) config of webpack.
   */
  alias?: ChainedConfig<Alias>;
  /**
   * Replaces variables in your code with other values or expressions at compile time.
   */
  define?: Record<string, any>;
  /**
   * Specify directories or modules that need additional compilation.
   * In order to maintain faster compilation speed, Builder will not compile files under node_modules through
   * `babel-loader` or `ts-loader` by default, as will as the files outside the current project directory.
   */
  include?: (string | RegExp)[];
  /**
   * Add a script before the entry file of each page.
   * This script will be executed before the page code.
   * It can be used to execute global logics, such as polyfill injection.
   */
  preEntry?: string | string[];
  /**
   * Define global variables. It can replace expressions like `process.env.FOO` in your code after compile.
   */
  globalVars?: Record<string, JSONValue>;
  /**
   * Restrict importing paths. After configuring this option, all source files can only import code from
   * the specific paths, and import code from other paths is not allowed.
   */
  moduleScopes?: ChainedConfig<ModuleScopes>;
  /**
   * Whether to compile JavaScript code imported via Data URI.
   */
  compileJsDataURI?: boolean;
  /**
   * This configuration will determine which field of `package.json` you use to import the `npm` module.
   * Same as the [resolve.mainFields](https://webpack.js.org/configuration/resolve/#resolvemainfields) config of webpack.
   */
  resolveMainFields?: (string[] | string)[];
  /**
   * Add a prefix to [resolve.extensions](https://webpack.js.org/configuration/resolve/#resolveextensions).
   */
  resolveExtensionPrefix?: string;
}

export interface NormalizedSharedSourceConfig extends SharedSourceConfig {
  define: Record<string, any>;
  preEntry: string[];
  globalVars: Record<string, JSONValue>;
  compileJsDataURI: boolean;
}
