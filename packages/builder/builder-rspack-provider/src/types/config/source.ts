import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
  ChainedConfig,
} from '@modern-js/builder-shared';

/**
 * type: Record<string, string> | Function
 *
 * not support Record<string, string[]>
 */
type Alias = ChainedConfig<Record<string, string>>;

export type SourceConfig = SharedSourceConfig & {
  alias?: Alias;
  define?: Record<string, string>;
};

export type NormalizedSourceConfig = NormalizedSharedSourceConfig & {
  alias?: Alias;
  define: Record<string, string>;
};
