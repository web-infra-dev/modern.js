import type { SharedPerformanceConfig } from '@modern-js/builder-shared';
import type { BundleAnalyzerPlugin } from '../../../compiled/webpack-bundle-analyzer';
import type webpack from 'webpack';

export type SplitChunks = webpack.Configuration extends {
  optimization?: {
    splitChunks?: infer P;
  };
}
  ? P
  : never;

export type CacheGroup = webpack.Configuration extends {
  optimization?: {
    splitChunks?:
      | {
          cacheGroups?: infer P;
        }
      | false;
  };
}
  ? P
  : never;

export interface BaseSplitRules {
  strategy: string;
  forceSplitting?: Array<RegExp>;
  override?: SplitChunks;
}

export interface BaseChunkSplit extends BaseSplitRules {
  strategy:
    | 'split-by-module'
    | 'split-by-experience'
    | 'all-in-one'
    | 'single-vendor';
}

export interface SplitBySize extends BaseSplitRules {
  strategy: 'split-by-size';
  minSize?: number;
  maxSize?: number;
}

export interface SplitCustom extends BaseSplitRules {
  strategy: 'custom';
  splitChunks?: SplitChunks;
}

export type BuilderChunkSplit = BaseChunkSplit | SplitBySize | SplitCustom;

export interface PerformanceConfig extends SharedPerformanceConfig {
  /**
   * Analyze the size of output files.
   */
  bundleAnalyze?: BundleAnalyzerPlugin.Options;
  /**
   * Configure the chunk splitting strategy.
   */
  chunkSplit?: BuilderChunkSplit;
}

export type NormalizedPerformanceConfig = PerformanceConfig &
  Required<SharedPerformanceConfig> & {
    chunkSplit: BuilderChunkSplit;
  };
