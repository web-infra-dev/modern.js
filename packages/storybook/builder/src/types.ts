import type { RsbuildPlugin } from '@rsbuild/core';
import type { UniBuilderConfig } from '@modern-js/uni-builder';

export type BundlerType = 'webpack' | 'rspack';

export type BuilderOptions = {
  bundler?: BundlerType;
  builderConfig?: UniBuilderConfig;
  configPath?: string;
};

export type BuilderConfig = UniBuilderConfig & {
  builderPlugins?: RsbuildPlugin[];
};

export function defineConfig(config: UniBuilderConfig) {
  return config;
}
