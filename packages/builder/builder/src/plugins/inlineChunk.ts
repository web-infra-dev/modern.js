import {
  pick,
  RUNTIME_CHUNK_NAME,
  isHtmlDisabled,
  DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export const builderPluginInlineChunk = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-inline-chunk',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { target, CHAIN_ID, isProd, HtmlPlugin }) => {
        const config = api.getNormalizedConfig();

        if (isHtmlDisabled(config, target) || !isProd) {
          return;
        }

        const { InlineChunkHtmlPlugin } = await import(
          '@modern-js/builder-shared'
        );

        const {
          disableInlineRuntimeChunk,
          enableInlineStyles,
          // todo: not support enableInlineScripts in rspack yet, which will take unknown build error
          enableInlineScripts,
        } = config.output;

        chain.plugin(CHAIN_ID.PLUGIN.INLINE_HTML).use(InlineChunkHtmlPlugin, [
          HtmlPlugin,
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
      },
    );
  },
});
