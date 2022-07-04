import type { NormalizedConfig } from '@modern-js/core';
import { CHAIN_ID, WebpackChain } from '@modern-js/utils';

export function applyInlineChunkPlugin({
  chain,
  config,
}: {
  chain: WebpackChain;
  config: NormalizedConfig;
}) {
  const HtmlWebpackPlugin: typeof import('html-webpack-plugin') = require('html-webpack-plugin');
  const InlineChunkHtmlPlugin: typeof import('../../plugins/inline-html-chunk-plugin') = require('../../plugins/inline-html-chunk-plugin');

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
