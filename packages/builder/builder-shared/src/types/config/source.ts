import type { BuilderTarget } from '../builder';
import type { JSONValue } from '../utils';

export type ModuleScopes = Array<string | RegExp>;

export type MainFields = (string | string[])[];

export interface SharedSourceConfig {
  /**
   * Specify directories or modules that need additional compilation.
   * In order to maintain faster compilation speed, Builder will not compile files under node_modules through
   * `babel-loader` or `ts-loader` by default, as will as the files outside the current project directory.
   */
  include?: (string | RegExp)[];
  /**
   * Specifies that certain files that will be excluded from compilation.
   */
  exclude?: (string | RegExp)[];
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
   * Whether to compile JavaScript code imported via Data URI.
   */
  compileJsDataURI?: boolean;
  /**
   * This configuration will determine which field of `package.json` you use to import the `npm` module.
   * Same as the [resolve.mainFields](https://webpack.js.org/configuration/resolve/#resolvemainfields) config of webpack.
   */
  resolveMainFields?: MainFields | Partial<Record<BuilderTarget, MainFields>>;
  /**
   * Add a prefix to [resolve.extensions](https://webpack.js.org/configuration/resolve/#resolveextensions).
   */
  resolveExtensionPrefix?: string | Partial<Record<BuilderTarget, string>>;
}

export interface NormalizedSharedSourceConfig extends SharedSourceConfig {
  preEntry: string[];
  globalVars: Record<string, JSONValue>;
  compileJsDataURI: boolean;
}
