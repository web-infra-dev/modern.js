import type { BuilderConfig as WebpackBuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RspackBuilderConfig } from '@modern-js/builder-rspack-provider';
import { BuilderPlugin } from '@modern-js/builder-shared';

export type BundlerType = 'webpack' | 'rspack';

export type { WebpackBuilderConfig, RspackBuilderConfig };

export type AllBuilderConfig = WebpackBuilderConfig | RspackBuilderConfig;

export type FrameworkOptions = {
  bundler?: BundlerType;
  builderConfig?: AllBuilderConfig;
  configPath?: string;
};

export type BuilderConfig = AllBuilderConfig & {
  builderPlugins?: BuilderPlugin[];
};

export { defineConfig } from '@modern-js/builder/cli';
