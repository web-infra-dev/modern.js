import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
  ChainedConfig,
} from '@modern-js/builder-shared';
import type { RspackBuiltinsConfig } from '../rspack';
/**
 * type: Record<string, string> | Function
 *
 * not support Record<string, string[]>
 */
type Alias = ChainedConfig<Record<string, string>>;

export type SourceConfig = SharedSourceConfig & {
  alias?: Alias;
  define?: RspackBuiltinsConfig['define'];
};

export type NormalizedSourceConfig = NormalizedSharedSourceConfig & {
  alias?: Alias;
  define: Record<string, string>;
};
