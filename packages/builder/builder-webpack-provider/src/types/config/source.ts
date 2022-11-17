import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
  ChainedConfig,
} from '@modern-js/builder-shared';

export type ModuleScopes = Array<string | RegExp>;

export interface SourceConfig extends SharedSourceConfig {
  /**
   * Restrict importing paths. After configuring this option, all source files can only import code from
   * the specific paths, and import code from other paths is not allowed.
   */
  moduleScopes?: ChainedConfig<ModuleScopes>;
}

export interface NormalizedSourceConfig extends NormalizedSharedSourceConfig {
  /**
   * Restrict importing paths. After configuring this option, all source files can only import code from
   * the specific paths, and import code from other paths is not allowed.
   */
  moduleScopes?: ChainedConfig<ModuleScopes>;
}
