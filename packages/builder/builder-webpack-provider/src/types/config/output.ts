import type {
  SharedOutputConfig,
  NormalizedSharedOutputConfig,
  RemOptions,
} from '@modern-js/builder-shared';
import type { CopyPluginOptions, WebpackConfig } from '../thirdParty';

export type ExternalsOptions = WebpackConfig['externals'];

export type OutputConfig = SharedOutputConfig & {
  /**
   * Copies the specified file or directory to the dist directory.
   */
  copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
  /**
   * Convert px to rem in CSS.
   */
  convertToRem?: boolean | RemOptions;
  /**
   * At build time, prevent some `import` dependencies from being packed into bundles in your code, and instead fetch them externally at runtime.
   * For more information, please see: [webpack Externals](https://webpack.js.org/configuration/externals/)
   */
  externals?: ExternalsOptions;
};

export type NormalizedOutputConfig = OutputConfig &
  NormalizedSharedOutputConfig;
