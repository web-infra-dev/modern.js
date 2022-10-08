import type { BuilderPlugin } from '../types';

export const PluginReact = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-react',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID, isProd }) => {
      if (isProd) {
        return;
      }
      const { default: ReactFastRefreshPlugin } = await import(
        '@modern-js/react-refresh-webpack-plugin'
      );
      const config = api.getBuilderConfig();
      const useTsLoader = Boolean(config.tools?.tsLoader);
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
