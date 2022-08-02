import { isProd } from '../shared';
import type { WebBuilderPlugin, WebpackChain } from '../types';

async function applyJsMinimizer(chain: WebpackChain) {
  const { CHAIN_ID } = await import('@modern-js/utils');
  const { default: TerserPlugin } = await import('terser-webpack-plugin');

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.JS)
    // TODO: options
    .use(TerserPlugin, [])
    .end();
}

async function applyCSSMinimizer(chain: WebpackChain) {
  const { CHAIN_ID } = await import('@modern-js/utils');
  const { default: CssMinimizerPlugin } = await import(
    'css-minimizer-webpack-plugin'
  );

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    // TODO: options
    .use(CssMinimizerPlugin, [])
    .end();
}

export const PluginMinimize = (): WebBuilderPlugin => ({
  name: 'web-builder-plugin-minimize',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      if (isProd()) {
        await applyJsMinimizer(chain);
        await applyCSSMinimizer(chain);
      }
    });
  },
});
