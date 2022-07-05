import { CHAIN_ID } from '@modern-js/utils';
import { JS_REGEX, SVG_REGEX, TS_REGEX } from '../../utils/constants';
import type { ChainUtils } from '../shared';

export function applySvgrLoader({
  config,
  loaders,
  mediaChunkName,
}: ChainUtils & {
  mediaChunkName: string;
}) {
  // svg
  loaders
    .oneOf(CHAIN_ID.ONE_OF.SVG_INLINE)
    .test(SVG_REGEX)
    .type('javascript/auto')
    .resourceQuery(/inline/)
    .use(CHAIN_ID.USE.SVGR)
    .loader(require.resolve('@svgr/webpack'))
    .options({ svgo: false })
    .end()
    .use(CHAIN_ID.USE.URL)
    .loader(require.resolve('../../../compiled/url-loader'))
    .options({
      limit: Infinity,
      name: mediaChunkName.replace(/\[ext\]$/, '.[ext]'),
    });

  loaders
    .oneOf(CHAIN_ID.ONE_OF.SVG_URL)
    .test(SVG_REGEX)
    .type('javascript/auto')
    .resourceQuery(/url/)
    .use(CHAIN_ID.USE.SVGR)
    .loader(require.resolve('@svgr/webpack'))
    .options({ svgo: false })
    .end()
    .use(CHAIN_ID.USE.URL)
    .loader(require.resolve('../../../compiled/url-loader'))
    .options({
      limit: false,
      name: mediaChunkName.replace(/\[ext\]$/, '.[ext]'),
    });

  loaders
    .oneOf(CHAIN_ID.ONE_OF.SVG)
    .test(SVG_REGEX)
    // The issuer option ensures that SVGR will only apply if the SVG is imported from a JS file.
    // If we import SVG from a CSS file, it will be processed as assets.
    .set('issuer', [JS_REGEX, TS_REGEX])
    .type('javascript/auto')
    .use(CHAIN_ID.USE.SVGR)
    .loader(require.resolve('@svgr/webpack'))
    .options({ svgo: false })
    .end()
    .use(CHAIN_ID.USE.URL)
    .loader(require.resolve('../../../compiled/url-loader'))
    .options({
      limit: config.output?.dataUriLimit,
      name: mediaChunkName.replace(/\[ext\]$/, '.[ext]'),
    });
}
