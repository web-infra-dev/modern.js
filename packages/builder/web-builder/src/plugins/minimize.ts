import { isProd } from '../shared';
import type {
  WebpackChain,
  WebBuilderPlugin,
  TerserPluginOptions,
} from '../types';

async function applyJsMinimizer(chain: WebpackChain) {
  const { CHAIN_ID } = await import('@modern-js/utils');
  const { default: TerserPlugin } = await import('terser-webpack-plugin');

  const options: TerserPluginOptions = {
    terserOptions: {
      mangle: {
        safari10: true,
      },
      format: {
        ascii_only: true,
      },
    },
  };

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.JS)
    // TODO: merge tools.terser
    .use(TerserPlugin, [
      // Due to terser-webpack-plugin has changed the type of class, which using a generic type in
      // constructor, leading auto inference of parameters of plugin constructor is not possible, using any instead
      options as any,
    ])
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
      const config = api.getBuilderConfig();

      if (isProd() && !config.output?.disableMinimize) {
        await applyJsMinimizer(chain);
        await applyCSSMinimizer(chain);
      }
    });
  },
});
