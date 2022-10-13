import type { BuilderPlugin } from '../types';

export const PluginHMR = (): BuilderPlugin => ({
  name: 'builder-plugin-hmr',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, isServer, CHAIN_ID, webpack }) => {
      if (isProd || isServer) {
        return;
      }
      const config = api.getNormalizedConfig();

      if (config.dev.hmr) {
        chain
          .plugin(CHAIN_ID.PLUGIN.HMR)
          .use(webpack.HotModuleReplacementPlugin);
      }
    });
  },
});
