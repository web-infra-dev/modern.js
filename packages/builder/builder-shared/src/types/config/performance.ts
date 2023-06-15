import type webpack from 'webpack';
import type { BundleAnalyzerPlugin } from '../../../compiled/webpack-bundle-analyzer';

export type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';

// may extends cache options in the futures
export type BuildCacheOptions = {
  /** Base directory for the filesystem cache. */
  cacheDirectory?: string;
};

export interface SharedPerformanceConfig {
  /**
   * Whether to remove `console.xx` in production build.
   */
  removeConsole?: boolean | ConsoleType[];
  /**
   * Whether to remove the locales of [moment.js](https://momentjs.com/).
   */
  removeMomentLocale?: boolean;
  /**
   * Controls the Builder's caching behavior during the build process.
   */
  buildCache?: BuildCacheOptions | boolean;
  /**
   * Whether to print the file sizes after production build.
   */
  printFileSize?: boolean;
  /**
   * Configure the chunk splitting strategy.
   */
  chunkSplit?: BuilderChunkSplit;

  /**
   * Analyze the size of output files.
   */
  bundleAnalyze?: BundleAnalyzerPlugin.Options;
}

export interface NormalizedSharedPerformanceConfig
  extends SharedPerformanceConfig {
  printFileSize: boolean;
  buildCache: BuildCacheOptions | boolean;
  chunkSplit: BuilderChunkSplit;
}

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

export type ForceSplitting = RegExp[] | Record<string, RegExp>;

export interface BaseSplitRules {
  strategy: string;
  forceSplitting?: ForceSplitting;
  override?: SplitChunks;
}

export interface BaseChunkSplit extends BaseSplitRules {
  /** todo: split-by-module not support in Rspack */
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
