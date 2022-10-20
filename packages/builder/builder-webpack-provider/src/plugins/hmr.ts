import type {
  BuilderPlugin,
  NormalizedConfig,
  ModifyWebpackUtils,
} from '../types';

export const isUsingHMR = (
  config: NormalizedConfig,
  { isProd, target }: ModifyWebpackUtils,
) => !isProd && target !== 'node' && target !== 'web-worker' && config.dev.hmr;

export const PluginHMR = (): BuilderPlugin => ({
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
