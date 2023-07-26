import type { Alias } from '@modern-js/utils';
import type { BuilderTarget } from '../builder';
import type { ModifyChainUtils } from '../hooks';
import type { ChainedConfig, JSONValue } from '../utils';

export type ModuleScopes = Array<string | RegExp>;

export type MainFields = (string | string[])[];

export type GlobalVars = Record<string, JSONValue>;

export type ChainedGlobalVars = ChainedConfig<
  GlobalVars,
  Pick<ModifyChainUtils, 'env' | 'target'>
>;

export type AliasStrategy = 'prefer-tsconfig' | 'prefer-alias';

export interface SharedSourceConfig {
  /**
   * Create aliases to import or require certain modules,
   * same as the [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) config of webpack.
   */
  alias?: ChainedConfig<Alias>;
  /**
   * Used to control the priority between the `paths` option in `tsconfig.json`
   * and the `alias` option in the bundler.
   */
  aliasStrategy?: AliasStrategy;
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
  globalVars?: ChainedGlobalVars;
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
  /**
   * Simple transformImport configuration
   */
  transformImport?: false | SharedTransformImport[];
}

export type SharedTransformImport = {
  libraryName: string;
  libraryDirectory?: string;
  style?: string | boolean;
  styleLibraryDirectory?: string;
  camelToDashComponentName?: boolean;
  transformToDefaultImport?: boolean;
};

export interface NormalizedSharedSourceConfig extends SharedSourceConfig {
  alias: ChainedConfig<Alias>;
  aliasStrategy: AliasStrategy;
  preEntry: string[];
  globalVars: ChainedGlobalVars;
  compileJsDataURI: boolean;
}
