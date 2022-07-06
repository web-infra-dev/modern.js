import { CHAIN_ID } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyYamlLoader({ loaders }: ChainUtils) {
  loaders
    .oneOf(CHAIN_ID.ONE_OF.YAML)
    .test(/\.ya?ml$/)
    .use(CHAIN_ID.USE.YAML)
    .loader(require.resolve('../../../compiled/yaml-loader'));
}
