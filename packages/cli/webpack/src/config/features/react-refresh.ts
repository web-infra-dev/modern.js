import { CHAIN_ID } from '@modern-js/utils';
import type { ChainUtils } from '../shared';

export function applyReactRefreshPlugin({ chain }: ChainUtils) {
  const ReactFastRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

  chain.plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH).use(ReactFastRefreshPlugin, [
    {
      overlay: false,
      exclude: [/node_modules/],
    },
  ]);
}

export function applyReactRefreshBabelPlugin({ chain }: ChainUtils) {
  chain.module
    .rule(CHAIN_ID.RULE.LOADERS)
    .oneOf(CHAIN_ID.ONE_OF.JS)
    .use(CHAIN_ID.USE.BABEL)
    .tap(options => ({
      ...options,
      plugins: [
        ...(options.plugins || []),
        require.resolve('react-refresh/babel'),
      ],
    }));
}
