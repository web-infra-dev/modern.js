import type { DevServerOptions } from '@modern-js/types';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

export type BuilderToolsConfig = Required<BuilderConfig>['tools'];

export interface ToolsUserConfig extends BuilderToolsConfig {
  devServer?: DevServerOptions;
}

export type ToolsNormalizedConfig = ToolsUserConfig;
