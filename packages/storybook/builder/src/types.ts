import type { RsbuildPlugin, RsbuildConfig } from '@rsbuild/shared';

export type BundlerType = 'webpack' | 'rspack';

export type AllBuilderConfig = RsbuildConfig;

export type BuilderOptions = {
  bundler?: BundlerType;
  builderConfig?: AllBuilderConfig;
  configPath?: string;
};

export type BuilderConfig = AllBuilderConfig & {
  builderPlugins?: RsbuildPlugin[];
};

// TODO
export { defineConfig } from '@rsbuild/core';
