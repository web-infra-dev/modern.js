import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import type Config from 'webpack-chain';

export function enableBundleAnalyzer(config: Config, reportFilename: string) {
  config.plugin('bundle-analyze').use(BundleAnalyzerPlugin, [
    {
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename,
    },
  ]);
}
