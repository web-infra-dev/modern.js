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

export type SourceConfig = Omit<SharedSourceConfig, 'Alias' | 'define'> & {
  alias?: Alias;
  define?: Record<string, string>;
};

export type NormalizedSourceConfig = Omit<
  NormalizedSharedSourceConfig,
  'Alias' | 'define'
> & {
  alias?: Alias;
  define: Record<string, string>;
};
