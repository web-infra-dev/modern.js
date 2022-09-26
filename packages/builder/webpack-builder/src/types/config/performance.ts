import type { BundleAnalyzerPlugin } from '../../../compiled/webpack-bundle-analyzer';
import type webpack from 'webpack';

export type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';

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

export interface BaseChunkSplit {
  strategy:
    | 'split-by-module'
    | 'split-by-experience'
    | 'all-in-one'
    | 'single-vendor';
  forceSplitting?: Array<RegExp>;
  override?: SplitChunks;
}

export interface SplitBySize {
  strategy: 'split-by-size';
  minSize?: number;
  maxSize?: number;
  forceSplitting?: Array<RegExp>;
  override?: SplitChunks;
}

export interface SplitCustom {
  strategy: 'custom';
  splitChunks?: SplitChunks;
  forceSplitting?: Array<RegExp>;
}

export type BuilderChunkSplit = BaseChunkSplit | SplitBySize | SplitCustom;

// may extends cache options in the futures
export type BuildCacheOptions = {
  /**
   * the webpack file cache direactory (defaults to .node_modules/.cache/webpack).
   */
  cacheDirectory?: string;
};

export interface PerformanceConfig {
  removeConsole?: boolean | ConsoleType[];
  removeMomentLocale?: boolean;
  bundleAnalyze?: BundleAnalyzerPlugin.Options;
  chunkSplit?: BuilderChunkSplit;
  buildCache?: BuildCacheOptions;
}
