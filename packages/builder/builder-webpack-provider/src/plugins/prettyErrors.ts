import type { BuilderPlugin } from '../types';

export function builderPluginPrettyErrors(): BuilderPlugin {
  return {
    name: 'builder-plugin-friendly-errors',
    setup(api) {
      const ENABLE_PRETTY_ERROR = process.env.CUSTOM_PRETTY_ERROR === 'true';
      api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
        if (!ENABLE_PRETTY_ERROR) {
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
