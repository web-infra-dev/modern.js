import type { ToolsConfig as WebpackBuilderToolsConfig } from '@modern-js/builder-webpack-provider';

export interface StorybookBuildConfig {
  webpack?: WebpackBuilderToolsConfig['webpack'];
  webpackChain?: WebpackBuilderToolsConfig['webpackChain'];
}
export interface Dev {
  storybook?: StorybookBuildConfig;
}
