import type {
  SharedOutputConfig,
  NormalizedSharedOutputConfig,
  RemOptions,
} from '@modern-js/builder-shared';

export type OutputConfig = SharedOutputConfig & {
  /**
   * Copies the specified file or directory to the dist directory.
   * TODO: not support yet
   */
  // copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
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
