import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
  ChainedConfig,
  ModuleScopes,
} from '@modern-js/builder-shared';

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
  define: Record<string, any>;

  /**
   * Restrict importing paths. After configuring this option, all source files can only import code from
   * the specific paths, and import code from other paths is not allowed.
   */
  moduleScopes?: ChainedConfig<ModuleScopes>;

  transformImport?: TransformImport[];
}
