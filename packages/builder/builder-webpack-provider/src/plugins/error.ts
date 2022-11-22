import type { BuilderPlugin } from '../types';

export const PluginFriendlyErrors = (): BuilderPlugin => ({
  name: 'builder-plugin-friendly-errors',
  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const { FriendlyErrorsWebpackPlugin } = await import(
        '@modern-js/friendly-errors-webpack-plugin'
      );
      chain
        .plugin(CHAIN_ID.PLUGIN.FRIENDLY_ERROR)
        .use(FriendlyErrorsWebpackPlugin);
    });
  },
});
