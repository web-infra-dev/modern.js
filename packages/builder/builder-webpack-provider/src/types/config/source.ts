import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
  ChainedConfig,
  ModuleScopes,
} from '@modern-js/builder-shared';
import type { Alias } from '@modern-js/utils';

export type TransformImport = {
  libraryName: string;
  libraryDirectory?: string;
  style?: string | boolean;
  styleLibraryDirectory?: string;
  camelToDashComponentName?: boolean;
  transformToDefaultImport?: boolean;
  customName?: ((member: string) => string | undefined) | string;
  customStyleName?: ((member: string) => string | undefined) | string;
};

export interface SourceConfig extends SharedSourceConfig {
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
   * Restrict importing paths. After configuring this option, all source files can only import code from
   * the specific paths, and import code from other paths is not allowed.
   */
  moduleScopes?: ChainedConfig<ModuleScopes>;
  /**
   * Configurare babel-plugin-import or swc-plugin-import or Rspack builtins plugin import
   */
  transformImport?: TransformImport[];
}

export interface NormalizedSourceConfig extends NormalizedSharedSourceConfig {
  /**
   * Create aliases to import or require certain modules,
   * same as the [resolve.alias](https://webpack.js.org/configuration/resolve/#resolvealias) config of webpack.
   */
  alias?: ChainedConfig<Alias>;

  define: Record<string, any>;

  /**
   * Restrict importing paths. After configuring this option, all source files can only import code from
   * the specific paths, and import code from other paths is not allowed.
   */
  moduleScopes?: ChainedConfig<ModuleScopes>;

  transformImport?: TransformImport[];
}
