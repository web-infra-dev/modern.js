import type { SharedPerformanceConfig } from '@modern-js/builder-shared';
import type { BundleAnalyzerPlugin } from '../../../compiled/webpack-bundle-analyzer';

export interface PerformanceConfig extends SharedPerformanceConfig {
  /**
   * Analyze the size of output files.
   */
  bundleAnalyze?: BundleAnalyzerPlugin.Options;
}

export type NormalizedPerformanceConfig = PerformanceConfig &
  Required<SharedPerformanceConfig>;
