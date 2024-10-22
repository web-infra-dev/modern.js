import type { BabelTransformOptions } from '@modern-js/types/common';
import type { ConfigChain } from './share';

type ToolsBabelConfig = ConfigChain<BabelTransformOptions, any>;

export interface ToolsUserConfig {
  babel?: ToolsBabelConfig;
}

export type ToolsNormalizedConfig = ToolsUserConfig;
