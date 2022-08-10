import type { BuilderPlugin } from '../types';

export const PluginHMR = (): BuilderPlugin => ({
  name: 'web-builder-plugin-hmr',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, isServer, CHAIN_ID, webpack }) => {
      if (isProd || isServer) {
        return;
      }

      const config = api.getBuilderConfig();
      const usingHMR = config.tools?.devServer?.hot !== false;

      if (usingHMR) {
        chain
          .plugin(CHAIN_ID.PLUGIN.HMR)
          .use(webpack.HotModuleReplacementPlugin);
      }
    });
  },
});
