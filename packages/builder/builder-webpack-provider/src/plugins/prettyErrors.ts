import type { BuilderPlugin } from '../types';
import type { ErrorFormatter } from '@modern-js/friendly-errors-webpack-plugin';

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

        const formatters: ErrorFormatter[] = [];
        const builtinFormatters = await import(
          '@modern-js/friendly-errors-webpack-plugin/formatter'
        );
        formatters.push(builtinFormatters.prettyFormatter);

        chain
          .plugin(CHAIN_ID.PLUGIN.FRIENDLY_ERRORS)
          .use(FriendlyErrorsWebpackPlugin, [{ formatters }]);
      });
    },
  };
}
