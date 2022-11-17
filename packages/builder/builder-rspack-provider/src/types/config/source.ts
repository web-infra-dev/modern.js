import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
} from '@modern-js/builder-shared';

export interface SourceConfig extends SharedSourceConfig {
  /**
   * Create aliases to import or require certain modules,
   */
  alias?: Record<string, string>;
}

export interface NormalizedSourceConfig extends NormalizedSharedSourceConfig {
  /**
   * Create aliases to import or require certain modules,
   */
  alias?: Record<string, string>;
}
