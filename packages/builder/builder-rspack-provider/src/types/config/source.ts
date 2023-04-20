import type {
  SharedSourceConfig,
  NormalizedSharedSourceConfig,
} from '@modern-js/builder-shared';
import type { Builtins } from '@rspack/core';
import type { RspackBuiltinsConfig } from '../rspack';

export type SourceConfig = SharedSourceConfig & {
  define?: RspackBuiltinsConfig['define'];
  transformImport?: false | Builtins['pluginImport'];
};

export type NormalizedSourceConfig = NormalizedSharedSourceConfig & {
  define: Record<string, string>;
  transformImport?: false | Builtins['pluginImport'];
};
