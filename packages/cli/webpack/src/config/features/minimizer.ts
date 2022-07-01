import { NormalizedConfig } from '@modern-js/core';
import { applyOptionsChain, CHAIN_ID, isProdProfile } from '@modern-js/utils';
import type WebpackChain from '@modern-js/utils/webpack-chain';

export function applyMinimizer({
  chain,
  config,
}: {
  chain: WebpackChain;
  config: NormalizedConfig;
}) {
  const TerserPlugin = require('terser-webpack-plugin');
  const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.JS)
    .use(TerserPlugin, [
      // FIXME: any type
      applyOptionsChain<any, any>(
        {
          terserOptions: {
            parse: { ecma: 8 },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: { safari10: true },
            // Added for profiling in devtools
            keep_classnames: isProdProfile(),
            keep_fnames: isProdProfile(),
            output: {
              ecma: 5,
              ascii_only: true,
            },
          },
        },
        config.tools?.terser,
      ),
    ])
    .end()
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    // FIXME: add `<any>` reason: Since the css-minimizer-webpack-plugin has been updated
    .use<any>(CssMinimizerPlugin, [
      applyOptionsChain({}, config.tools?.minifyCss),
    ]);
}
