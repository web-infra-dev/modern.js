import type { BuilderPlugin } from '../types';

export const PluginProgress = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-progress',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isServer, CHAIN_ID }) => {
      const { default: WebpackBar } = await import('../../compiled/webpackbar');

      chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(WebpackBar, [
        {
          name: isServer ? 'server' : 'client',
        },
      ]);
    });
  },
});
