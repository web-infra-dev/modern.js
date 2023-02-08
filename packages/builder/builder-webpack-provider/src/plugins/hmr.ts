import type {
  BuilderPlugin,
  NormalizedConfig,
  ModifyWebpackChainUtils,
} from '../types';

export const isUsingHMR = (
  config: NormalizedConfig,
  { isProd, target }: ModifyWebpackChainUtils,
) =>
  !isProd &&
  target !== 'node' &&
  target !== 'web-worker' &&
  target !== 'server-worker' &&
  config.dev.hmr;

export const builderPluginHMR = (): BuilderPlugin => ({
  name: 'builder-plugin-hmr',

  setup(api) {
    api.modifyWebpackChain((chain, utils) => {
      const config = api.getNormalizedConfig();

      if (!isUsingHMR(config, utils)) {
        return;
      }

      const { webpack, CHAIN_ID } = utils;
      chain.plugin(CHAIN_ID.PLUGIN.HMR).use(webpack.HotModuleReplacementPlugin);
    });
  },
});
