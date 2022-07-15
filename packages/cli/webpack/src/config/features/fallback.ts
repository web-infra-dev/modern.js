import { CHAIN_ID } from '@modern-js/utils';
import { CSS_REGEX, JS_REGEX, TS_REGEX } from '../../utils/constants';
import type { ChainUtils } from '../shared';

export function applyFallbackLoader({ loaders }: ChainUtils) {
  loaders
    .oneOf(CHAIN_ID.ONE_OF.FALLBACK)
    .exclude.add(/^$/)
    .add(JS_REGEX)
    .add(TS_REGEX)
    .add(CSS_REGEX)
    .add(/\.(html?|json|wasm|ya?ml|toml|md)$/)
    .end()
    .use(CHAIN_ID.USE.FILE)
    .loader(require.resolve('../../../compiled/file-loader'));
}
