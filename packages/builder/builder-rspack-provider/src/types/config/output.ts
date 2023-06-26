import type {
  SharedOutputConfig,
  NormalizedSharedOutputConfig,
} from '@modern-js/builder-shared';
import type { Builtins } from '@rspack/core';

export type OutputConfig = SharedOutputConfig & {
  /**
   * Copies the specified file or directory to the dist directory.
   */
  copy?: Builtins['copy'] | NonNullable<Builtins['copy']>['patterns'];
};

export type NormalizedOutputConfig = OutputConfig &
  NormalizedSharedOutputConfig;
