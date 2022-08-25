import { JS_REGEX, SVG_REGEX, TS_REGEX } from '../shared';
import { BuilderPlugin } from '../types';

export const PluginSvg = (): BuilderPlugin => {
  return {
    name: 'webpack-builder-plugin-svg',
    setup(api) {
      api.modifyWebpackChain(async (chain, { CHAIN_ID, getCompiledPath }) => {
        const config = api.getBuilderConfig();
        const defaultExport = config.output?.svgDefaultExport || 'url';
        // The issuer option ensures that SVGR will only apply if the SVG is imported from a JS file.
        // If we import SVG from a CSS file, it will be processed as assets.
        chain.module
          .rule(CHAIN_ID.RULE.SVG_INLINE)
          .test(SVG_REGEX)
          .set('issuer', [JS_REGEX, TS_REGEX])
          .type('javascript/auto')
          .resourceQuery(/inline/)
          .use(CHAIN_ID.USE.SVGR)
          .loader(require.resolve('@svgr/webpack'))
          .options({ svgo: false })
          .end()
          .use(CHAIN_ID.USE.URL)
          .loader(getCompiledPath('url-loader'))
          .options({
            limit: Infinity,
            name: `assets/[name].[contenthash:8].[ext]`,
          });

        chain.module
          .rule(CHAIN_ID.RULE.SVG_URL)
          .test(SVG_REGEX)
          .set('issuer', [JS_REGEX, TS_REGEX])
          .type('javascript/auto')
          .resourceQuery(/url/)
          .use(CHAIN_ID.USE.SVGR)
          .loader(require.resolve('@svgr/webpack'))
          .options({ svgo: false })
          .end()
          .use(CHAIN_ID.USE.URL)
          .loader(getCompiledPath('url-loader'))
          .options({
            limit: false,
            name: `assets/[name].[contenthash:8].[ext]`,
          });

        chain.module
          .rule(CHAIN_ID.RULE.SVG)
          .test(SVG_REGEX)
          .set('issuer', [JS_REGEX, TS_REGEX])
          .type('javascript/auto')
          .use(CHAIN_ID.USE.SVGR)
          .loader(require.resolve('@svgr/webpack'))
          .options({ svgo: false })
          .end()
          .when(defaultExport === 'url', c =>
            c
              .use(CHAIN_ID.USE.URL)
              .loader(getCompiledPath('url-loader'))
              .options({
                limit: config.output?.dataUriLimit || 4096,
                name: `assets/[name].[contenthash:8].[ext]`,
              }),
          );
      });
    },
  };
};
