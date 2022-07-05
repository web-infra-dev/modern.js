import { CHAIN_ID } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyTomlLoader({ loaders }: ChainUtils) {
  loaders
    .oneOf(CHAIN_ID.ONE_OF.TOML)
    .test(/\.toml$/)
    .use(CHAIN_ID.USE.TOML)
    .loader(require.resolve('../../../compiled/toml-loader'));
}
