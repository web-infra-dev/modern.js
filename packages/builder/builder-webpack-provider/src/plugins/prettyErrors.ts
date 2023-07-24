import type { BuilderPlugin } from '../types';

export function builderPluginFriendlyErrors(): BuilderPlugin {
  return {
    name: 'builder-plugin-friendly-errors',
    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
        const config = api.getNormalizedConfig();
        if (config.output.disablePrettyErrors) {
          return;
        }
        const { FriendlyErrorsWebpackPlugin } = await import(
          '@modern-js/friendly-errors-webpack-plugin'
        );
        chain
          .plugin(CHAIN_ID.PLUGIN.FRIENDLY_ERRORS)
          .use(FriendlyErrorsWebpackPlugin);
      });
    },
  };
}
