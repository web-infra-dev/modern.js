import { CHAIN_ID } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyMarkdownLoader({ loaders }: ChainUtils) {
  loaders
    .oneOf(CHAIN_ID.ONE_OF.MARKDOWN)
    .test(/\.md$/)
    .use(CHAIN_ID.USE.HTML)
    .loader(require.resolve('html-loader'))
    .end()
    .use(CHAIN_ID.USE.MARKDOWN)
    .loader(require.resolve('../../../compiled/markdown-loader'));
}
