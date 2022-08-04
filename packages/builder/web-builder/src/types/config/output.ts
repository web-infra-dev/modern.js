import type { CopyPluginOptions } from '../thirdParty';

export interface OutputConfig {
  copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
  disableMinimize?: boolean;
  disableSourceMap?: boolean;
}
