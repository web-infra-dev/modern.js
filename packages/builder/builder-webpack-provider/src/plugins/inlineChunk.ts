import { RUNTIME_CHUNK_NAME } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const PluginInlineChunk = (): BuilderPlugin => ({
  name: 'builder-plugin-inline-chunk',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const { default: HtmlWebpackPlugin } = await import(
        'html-webpack-plugin'
      );
      const { InlineChunkHtmlPlugin } = await import(
        '../webpackPlugins/InlineChunkHtmlPlugin'
      );

      const config = api.getNormalizedConfig();
      const {
        disableInlineRuntimeChunk,
        enableInlineStyles,
        enableInlineScripts,
      } = config.output;

      chain.plugin(CHAIN_ID.PLUGIN.INLINE_HTML).use(InlineChunkHtmlPlugin, [
        HtmlWebpackPlugin,
        [
          enableInlineScripts && /\.js$/,
          enableInlineStyles && /\.css$/,
          !disableInlineRuntimeChunk &&
            // RegExp like /builder-runtime([.].+)?\.js$/
            // matches builder-runtime.js and builder-runtime.123456.js
            new RegExp(`${RUNTIME_CHUNK_NAME}([.].+)?\\.js$`),
        ].filter(Boolean) as RegExp[],
      ]);
    });
  },
});
