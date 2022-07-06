import { applyOptionsChain, CHAIN_ID, isProdProfile } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyMinimizer({ chain, config }: ChainUtils) {
  const TerserPlugin = require('terser-webpack-plugin');
  const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.JS)
    .use(TerserPlugin, [
      // FIXME: any type
      applyOptionsChain<any, any>(
        {
          terserOptions: {
            compress: {
              ecma: 5,
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
