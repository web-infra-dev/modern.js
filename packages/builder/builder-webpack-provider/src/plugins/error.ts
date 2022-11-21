import type { OutputPrettyErrorOptions } from '@modern-js/friendly-errors-webpack-plugin';
import { BuilderPlugin } from '@modern-js/builder-shared';
import { BuilderPluginAPI } from '../types';

export const PluginFriendlyErrors = (
  options?: OutputPrettyErrorOptions,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'friendly-errors',
  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const { FriendlyErrorsWebpackPlugin } = await import(
        '@modern-js/friendly-errors-webpack-plugin'
      );
      chain
        .plugin(CHAIN_ID.PLUGIN.FRIENDLY_ERROR)
        .use(FriendlyErrorsWebpackPlugin, [options]);
    });
  },
});
