import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginReact = (): RsbuildPlugin => ({
  name: 'uni-builder:react',

  pre: ['uni-builder:babel'],

  setup(api) {
    api.modifyBundlerChain(async (chain, utils) => {
      const config = api.getNormalizedConfig();

      const usingHMR =
        !utils.isProd && config.dev.hmr && utils.target === 'web';
      if (!usingHMR) {
        return;
      }

      const { CHAIN_ID } = utils;
      const { default: ReactFastRefreshPlugin } = await import(
        '@pmmmwh/react-refresh-webpack-plugin'
      );

      [CHAIN_ID.RULE.TS, CHAIN_ID.RULE.JS].forEach(ruleId => {
        if (!chain.module.rules.get(ruleId)) {
          return;
        }
        const rule = chain.module.rule(ruleId);

        if (!rule.uses.get(CHAIN_ID.USE.BABEL)) {
          return;
        }

        rule.use(CHAIN_ID.USE.BABEL).tap(options => ({
          ...options,
          plugins: [
            ...(options.plugins || []),
            [require.resolve('react-refresh/babel'), { skipEnvCheck: true }],
          ],
        }));
      });

      chain
        .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
        .use(ReactFastRefreshPlugin, [
          {
            overlay: false,
            exclude: [/node_modules/],
          },
        ]);
    });
  },
});
