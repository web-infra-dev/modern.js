import { CHAIN_ID, WebpackChain } from '@modern-js/utils';

export function applyReactRefreshPlugin(chain: WebpackChain) {
  const ReactFastRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

  chain.plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH).use(ReactFastRefreshPlugin, [
    {
      overlay: false,
      exclude: [/node_modules/],
    },
  ]);
}

export function applyReactRefreshBabelPlugin(chain: WebpackChain) {
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
