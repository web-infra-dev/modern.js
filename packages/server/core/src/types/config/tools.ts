import { BabelTransformOptions } from '@modern-js/types/common';
import { ChainedConfig } from './share';

type ToolsBabelConfig = ChainedConfig<BabelTransformOptions, any>;

export interface ToolsUserConfig {
  babel?: ToolsBabelConfig;
}

export type ToolsNormalizedConfig = ToolsUserConfig;
