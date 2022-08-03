import type { CopyPluginOptions } from '../thirdParty';

export interface WebBuilderOutputConfig {
  copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
  disableMinimize?: boolean;
  disableSourceMap?: boolean;
}
