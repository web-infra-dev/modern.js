import { isFastRefresh } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-fast-refresh',

  setup: () => ({
    config() {
      return {
        tools: {
          webpackChain: (chain, { name }) => {
            if (name === 'client' && isFastRefresh()) {
              const ReactFastRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
              chain.plugin('react-fast-refresh').use(ReactFastRefreshPlugin, [
                {
                  overlay: false,
                  exclude: [/node_modules/],
                },
              ]);

              const loaders = chain.module.rule('loaders');

              const babelOptions = loaders
                .oneOf('js')
                .use('babel')
                .get('options');

              loaders
                .oneOf('js')
                .use('babel')
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
