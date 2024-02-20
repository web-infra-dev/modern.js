import type { ToolsConfig } from '@rsbuild/core';

export interface StorybookBuildConfig {
  webpack?: ToolsConfig['webpack'];
  webpackChain?: ToolsConfig['webpackChain'];
}
export interface Dev {
  storybook?: StorybookBuildConfig;
}
