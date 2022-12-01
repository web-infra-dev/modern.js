import { BabelConfigUtils } from '@modern-js/babel-preset-app';
import { BabelTransformOptions } from '@modern-js/types/common';
import { ChainedConfig } from './share';

type ToolsBabelConfig = ChainedConfig<BabelTransformOptions, BabelConfigUtils>;

export interface ToolsUserConfig {
  babel?: ToolsBabelConfig;
}

export type ToolsNormalizedConfig = ToolsUserConfig;
