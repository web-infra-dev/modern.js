import { CHAIN_ID } from '@modern-js/utils';
import { IgnorePlugin } from 'webpack';
import { ChainUtils } from '../shared';

export function applyIgnorePlugin({ chain }: ChainUtils) {
  chain.plugin(CHAIN_ID.PLUGIN.IGNORE).use(IgnorePlugin, [
    {
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    },
  ]);
}
