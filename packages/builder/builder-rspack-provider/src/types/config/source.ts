import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
  ChainedConfig,
} from '@modern-js/builder-shared';
import type { Builtins } from '@rspack/core';
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
  transformImport?: Builtins['pluginImport'];
};

export type NormalizedSourceConfig = NormalizedSharedSourceConfig & {
  alias?: Alias;
  define: Record<string, string>;
  transformImport?: Builtins['pluginImport'];
};
