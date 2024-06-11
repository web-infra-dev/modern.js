import { BabelTransformOptions } from '@modern-js/types/common';
import { ConfigChain } from './share';

type ToolsBabelConfig = ConfigChain<BabelTransformOptions, any>;

export interface ToolsUserConfig {
  babel?: ToolsBabelConfig;
}

export type ToolsNormalizedConfig = ToolsUserConfig;
