import { pick, RUNTIME_CHUNK_NAME } from '@modern-js/builder-shared';
import { isHtmlDisabled } from './html';
import type { BuilderPlugin } from '../types';

export const PluginInlineChunk = (): BuilderPlugin => ({
  name: 'builder-plugin-inline-chunk',

  setup(api) {
    api.modifyWebpackChain(async (chain, { target, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      if (isHtmlDisabled(config, target)) {
        return;
      }

      const { default: HtmlWebpackPlugin } = await import(
        'html-webpack-plugin'
      );
      const { InlineChunkHtmlPlugin } = await import(
        '../webpackPlugins/InlineChunkHtmlPlugin'
      );

      const {
        disableInlineRuntimeChunk,
        enableInlineStyles,
        enableInlineScripts,
      } = config.output;

      chain.plugin(CHAIN_ID.PLUGIN.INLINE_HTML).use(InlineChunkHtmlPlugin, [
        HtmlWebpackPlugin,
        {
          tests: [
            enableInlineScripts && /\.js$/,
            enableInlineStyles && /\.css$/,
            !disableInlineRuntimeChunk &&
              // RegExp like /builder-runtime([.].+)?\.js$/
              // matches builder-runtime.js and builder-runtime.123456.js
              new RegExp(`${RUNTIME_CHUNK_NAME}([.].+)?\\.js$`),
          ].filter(Boolean) as RegExp[],
          distPath: pick(config.output.distPath, ['js', 'css']),
        },
      ]);
    });
  },
});
