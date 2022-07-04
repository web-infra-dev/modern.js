import { CHAIN_ID } from '@modern-js/utils';
import { ASSETS_REGEX } from '../../utils/constants';
import type { ChainUtils } from '../shared';

export function applyAssetsLoader({ config, loaders }: ChainUtils) {
  // img, font assets
  loaders
    .oneOf(CHAIN_ID.ONE_OF.ASSETS_INLINE)
    .test(ASSETS_REGEX)
    .type('asset/inline' as any)
    .resourceQuery(/inline/);

  loaders
    .oneOf(CHAIN_ID.ONE_OF.ASSETS_URL)
    .test(ASSETS_REGEX)
    .type('asset/resource' as any)
    .resourceQuery(/url/);

  loaders
    .oneOf(CHAIN_ID.ONE_OF.ASSETS)
    .test(ASSETS_REGEX)
    .type('asset' as any)
    .parser({
      dataUrlCondition: {
        maxSize: config.output?.dataUriLimit,
      },
    });
}
