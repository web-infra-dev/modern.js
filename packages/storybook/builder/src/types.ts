import type { BuilderConfig as WebpackBuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RspackBuilderConfig } from '@modern-js/builder-rspack-provider';

export type BundlerType = 'webpack' | 'rspack';

export type { WebpackBuilderConfig, RspackBuilderConfig };

export type AllBuilderConfig = WebpackBuilderConfig | RspackBuilderConfig;

export type FrameworkOptions = {
  bundler: BundlerType;
  builderConfig: AllBuilderConfig;
};
