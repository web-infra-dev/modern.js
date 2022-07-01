import { NormalizedConfig } from '@modern-js/core';
import { CHAIN_ID } from '@modern-js/utils';
import type { WebpackChain } from '@modern-js/utils';
import { SVG_REGEX } from '../../utils/constants';

export function applySvgrLoader({
  config,
  loaders,
  mediaChunkName,
}: {
  config: NormalizedConfig;
  loaders: WebpackChain.Rule<WebpackChain.Module>;
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
