import type { WebBuilderPlugin } from '../types';

export const PluginProgress = (): WebBuilderPlugin => ({
  name: 'web-builder-plugin-progress',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      const { CHAIN_ID } = await import('@modern-js/utils');
      const WebpackBar = (await import('../../compiled/webpackbar')).default;

      chain
        .plugin(CHAIN_ID.PLUGIN.PROGRESS)
        .use(WebpackBar, [{ name: chain.get('name') }]);
    });
  },
});
