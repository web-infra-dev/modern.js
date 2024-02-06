import type { RsbuildPlugin, RsbuildConfig } from '@rsbuild/shared';
import type { UniBuilderConfig } from '@modern-js/uni-builder';

export type BundlerType = 'webpack' | 'rspack';

export type BuilderOptions = {
  bundler?: BundlerType;
  builderConfig?: RsbuildConfig;
  configPath?: string;
};

export type BuilderConfig = UniBuilderConfig & {
  builderPlugins?: RsbuildPlugin[];
};

export function defineConfig(config: UniBuilderConfig) {
  return config;
}
