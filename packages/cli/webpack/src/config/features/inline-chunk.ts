import { CHAIN_ID } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyInlineChunkPlugin({ chain, config }: ChainUtils) {
  const HtmlWebpackPlugin: typeof import('html-webpack-plugin') = require('html-webpack-plugin');
  const {
    InlineChunkHtmlPlugin,
  }: typeof import('../../plugins/inline-html-chunk-plugin') = require('../../plugins/inline-html-chunk-plugin');

  const { disableInlineRuntimeChunk, enableInlineStyles, enableInlineScripts } =
    config.output;

  chain
    .plugin(CHAIN_ID.PLUGIN.INLINE_HTML)
    .use(InlineChunkHtmlPlugin, [
      HtmlWebpackPlugin,
      [
        enableInlineScripts && /\.js$/,
        enableInlineStyles && /\.css$/,
        !disableInlineRuntimeChunk && /runtime-.+[.]js$/,
      ].filter(Boolean) as RegExp[],
    ]);
}
