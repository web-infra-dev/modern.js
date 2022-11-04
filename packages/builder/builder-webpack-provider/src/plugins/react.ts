import type { BuilderPlugin } from '../types';

export const PluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID, isProd }) => {
      const config = api.getNormalizedConfig();

      if (isProd || config.dev.hmr === false) {
        return;
      }

      const { default: ReactFastRefreshPlugin } = await import(
        '@pmmmwh/react-refresh-webpack-plugin'
      );
      const useTsLoader = Boolean(config.tools.tsLoader);
      const rule = useTsLoader
        ? chain.module.rule(CHAIN_ID.RULE.TS)
        : chain.module.rule(CHAIN_ID.RULE.JS);

      rule.use(CHAIN_ID.USE.BABEL).tap(options => ({
        ...options,
        plugins: [
          ...(options.plugins || []),
          [require.resolve('react-refresh/babel'), { skipEnvCheck: true }],
        ],
      }));

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
