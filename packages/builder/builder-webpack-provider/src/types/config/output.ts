import type {
  SharedOutputConfig,
  NormalizedSharedOutputConfig,
} from '@modern-js/builder-shared';
import type { CopyPluginOptions } from '../thirdParty';

export type OutputConfig = SharedOutputConfig & {
  /**
   * Copies the specified file or directory to the dist directory.
   */
  copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
};

export type NormalizedOutputConfig = OutputConfig &
  NormalizedSharedOutputConfig;
