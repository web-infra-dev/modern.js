import { join } from 'path';
import { JS_REGEX, TS_REGEX, SVG_REGEX } from '@modern-js/builder-shared';
import {
  getDistPath,
  getFilename,
  getDataUrlLimit,
  getDataUrlCondition,
} from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginSvg = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-svg',
    setup(api) {
      api.modifyWebpackChain(
        async (chain, { isProd, CHAIN_ID, getCompiledPath }) => {
          const config = api.getNormalizedConfig();
          const defaultExport = config.output.svgDefaultExport;

          const distDir = getDistPath(config, 'svg');
          const filename = getFilename(config, 'svg', isProd);
          const outputName = join(distDir, filename);

          const rule = chain.module.rule(CHAIN_ID.RULE.SVG).test(SVG_REGEX);

          rule
            .oneOf(CHAIN_ID.ONE_OF.SVG_ASSET)
            // The issuer option ensures that SVGR will only apply if the SVG is imported from a JS file.
            // If we import SVG from a CSS file, it will be processed as assets.
            .set('issuer', {
              not: [JS_REGEX, TS_REGEX],
            })
            .type('asset')
            .parser({
              dataUrlCondition: getDataUrlCondition(config, 'svg'),
            })
            .set('generator', {
              filename: join(distDir, filename),
            });

          rule
            .oneOf(CHAIN_ID.ONE_OF.SVG_INLINE)
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
              name: outputName,
            });

          rule
            .oneOf(CHAIN_ID.ONE_OF.SVG_URL)
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
              name: outputName,
            });

          rule
            .oneOf(CHAIN_ID.ONE_OF.SVG)
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
                  limit: getDataUrlLimit(config, 'svg'),
                  name: outputName,
                }),
            );
        },
      );
    },
  };
};
