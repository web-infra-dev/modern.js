import type {
  SharedOutputConfig,
  NormalizedSharedOutputConfig,
  RemOptions,
} from '@modern-js/builder-shared';
import type { Builtins } from '@rspack/core';

export type OutputConfig = Omit<SharedOutputConfig, 'legalComments'> & {
  /**
   * Copies the specified file or directory to the dist directory.
   */
  copy?: Builtins['copy'];
  /**
   * Convert px to rem in CSS.
   */
  convertToRem?: boolean | RemOptions;
  /**
   * At build time, prevent some `import` dependencies from being packed into bundles in your code, and instead fetch them externally at runtime.
   */
  externals?: Record<string, string>;
};

export type NormalizedOutputConfig = OutputConfig &
  NormalizedSharedOutputConfig;
