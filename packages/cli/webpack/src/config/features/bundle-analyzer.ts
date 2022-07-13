import { CHAIN_ID } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyBundleAnalyzerPlugin({
  chain,
  reportFilename,
}: ChainUtils & {
  reportFilename: string;
}) {
  const {
    BundleAnalyzerPlugin,
  } = require('../../../compiled/webpack-bundle-analyzer');

  chain.plugin(CHAIN_ID.PLUGIN.BUNDLE_ANALYZER).use(BundleAnalyzerPlugin, [
    {
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename,
    },
  ]);
}
