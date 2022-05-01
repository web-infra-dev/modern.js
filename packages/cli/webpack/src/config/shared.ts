import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import type { WebpackChain } from '../compiled';

export function enableBundleAnalyzer(
  config: WebpackChain,
  reportFilename: string,
) {
  config.plugin('bundle-analyze').use(BundleAnalyzerPlugin, [
    {
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename,
    },
  ]);
}
