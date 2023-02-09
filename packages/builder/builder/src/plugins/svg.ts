import { join } from 'path';
import {
  JS_REGEX,
  TS_REGEX,
  SVG_REGEX,
  getDistPath,
  getFilename,
  chainStaticAssetRule,
} from '@modern-js/builder-shared';
import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';

export const getCompiledPath = (packageName: string) =>
  join(__dirname, '../../compiled', packageName);

export const builderPluginSvg = (): DefaultBuilderPlugin => {
  return {
    name: 'builder-plugin-svg',
    setup(api) {
      api.modifyBundlerChain(async (chain, { isProd, CHAIN_ID }) => {
        const config = api.getNormalizedConfig();
        const defaultExport = config.output.svgDefaultExport;
        const assetType = 'svg';

        const distDir = getDistPath(config.output, 'svg');
        const filename = getFilename(config.output, 'svg', isProd);
        const outputName = join(distDir, filename);
        const maxSize = config.output.dataUriLimit[assetType];

        const rule = chain.module.rule(CHAIN_ID.RULE.SVG).test(SVG_REGEX);

        // If we import SVG from a CSS file, it will be processed as assets.
        chainStaticAssetRule({
          rule,
          maxSize,
          filename: join(distDir, filename),
          assetType,
          issuer: {
            // The issuer option ensures that SVGR will only apply if the SVG is imported from a JS file.
            not: [JS_REGEX, TS_REGEX],
          },
        });

        rule
          .oneOf(CHAIN_ID.ONE_OF.SVG_INLINE)
          .type('javascript/auto')
          .resourceQuery(/inline/)
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
                limit: config.output.dataUriLimit.svg,
                name: outputName,
              }),
          );
      });
    },
  };
};
