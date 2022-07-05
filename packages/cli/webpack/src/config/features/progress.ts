import { CHAIN_ID } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyProgressPlugin({ chain }: ChainUtils) {
  const WebpackBar = require('../../../compiled/webpackbar');

  chain
    .plugin(CHAIN_ID.PLUGIN.PROGRESS)
    .use(WebpackBar, [{ name: chain.get('name') }]);
}
