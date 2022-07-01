import { CHAIN_ID } from '@modern-js/utils';
import type { WebpackChain } from '@modern-js/utils';

export function applyBundleAnalyzerPlugin({
  chain,
  reportFilename,
}: {
  chain: WebpackChain;
  reportFilename: string;
}) {
  const BundleAnalyzerPlugin = require('../../../compiled/webpack-bundle-analyzer');

  chain.plugin(CHAIN_ID.PLUGIN.BUNDLE_ANALYZER).use(BundleAnalyzerPlugin, [
    {
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename,
    },
  ]);
}
