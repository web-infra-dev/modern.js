import { CHAIN_ID } from '@modern-js/utils/chain-id';
import {
  getCssnanoDefaultOptions,
  getJSMinifyOptions,
} from '@modern-js/builder-shared';
import type {
  WebpackChain,
  BuilderPlugin,
  CssMinimizerPluginOptions,
  NormalizedConfig,
} from '../types';

async function applyJSMinimizer(chain: WebpackChain, config: NormalizedConfig) {
  const { default: TerserPlugin } = await import('terser-webpack-plugin');

  const finalOptions = await getJSMinifyOptions(config);

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.JS)
    .use(TerserPlugin, [
      // Due to terser-webpack-plugin has changed the type of class, which using a generic type in
      // constructor, leading auto inference of parameters of plugin constructor is not possible, using any instead
      finalOptions as any,
    ])
    .end();
}

async function applyCSSMinimizer(
  chain: WebpackChain,
  config: NormalizedConfig,
) {
  const { CHAIN_ID, applyOptionsChain } = await import('@modern-js/utils');
  const { default: CssMinimizerPlugin } = await import(
    'css-minimizer-webpack-plugin'
  );

  const mergedOptions: CssMinimizerPluginOptions = applyOptionsChain(
    {
      minimizerOptions: getCssnanoDefaultOptions(),
    },
    config.tools.minifyCss,
  );

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    .use(CssMinimizerPlugin, [
      // Due to css-minimizer-webpack-plugin has changed the type of class, which using a generic type in
      // constructor, leading auto inference of parameters of plugin constructor is not possible, using any instead
      mergedOptions as any,
    ])
    .end();
}

export const builderPluginMinimize = (): BuilderPlugin => ({
  name: 'builder-plugin-minimize',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize = isProd && !config.output.disableMinimize;

      // set minimize to allow users to disable minimize
      chain.optimization.minimize(isMinimize);

      if (isMinimize) {
        await applyJSMinimizer(chain, config);
        await applyCSSMinimizer(chain, config);
      }
    });
  },
});
