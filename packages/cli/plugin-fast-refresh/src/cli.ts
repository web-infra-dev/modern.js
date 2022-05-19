import { isFastRefresh } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-fast-refresh',

  setup: () => ({
    config() {
      return {
        tools: {
          webpackChain: (chain, { name, CHAIN_ID }) => {
            if (name === 'client' && isFastRefresh()) {
              const ReactFastRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
              chain
                .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
                .use(ReactFastRefreshPlugin, [
                  {
                    overlay: false,
                    exclude: [/node_modules/],
                  },
                ]);

              const loaders = chain.module.rule(CHAIN_ID.RULE.LOADERS);

              const babelOptions = loaders
                .oneOf(CHAIN_ID.ONE_OF.JS)
                .use(CHAIN_ID.USE.BABEL)
                .get('options');

              loaders
                .oneOf(CHAIN_ID.ONE_OF.JS)
                .use(CHAIN_ID.USE.BABEL)
                .options({
                  ...babelOptions,
                  plugins: [
                    ...(babelOptions.plugins || []),
                    require.resolve('react-refresh/babel'),
                  ],
                });
            }
          },
        },
      };
    },
  }),
});
