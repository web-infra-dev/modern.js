import type { BuilderPlugin } from '../types';

export const PluginProgress = (): BuilderPlugin => ({
  name: 'web-builder-plugin-progress',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isServer }) => {
      const { CHAIN_ID } = await import('@modern-js/utils');
      const { default: WebpackBar } = await import('../../compiled/webpackbar');

      chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(WebpackBar, [
        {
          name: isServer ? 'server' : 'client',
        },
      ]);
    });
  },
});
