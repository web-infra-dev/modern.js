import type { BuilderPlugin } from '../types';
import { isUsingHMR } from '@modern-js/builder-shared';

export const builderPluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  pre: ['builder-plugin-swc'],

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd, target }) => {
      const config = api.getNormalizedConfig();
      const usingHMR = isUsingHMR(config, { isProd, target });
      const rule = chain.module.rule(CHAIN_ID.RULE.JS);

      const reactOptions = {
        development: !isProd,
        refresh: usingHMR,
        runtime: 'automatic',
      };

      rule.use(CHAIN_ID.USE.SWC).tap(options => {
        options.jsc.transform.react = {
          ...reactOptions,
        };
        return options;
      });

      if (chain.module.rules.has(CHAIN_ID.RULE.JS_DATA_URI)) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .use(CHAIN_ID.USE.SWC)
          .tap(options => {
            options.jsc.transform.react = {
              ...reactOptions,
            };
            return options;
          });
      }

      if (!usingHMR) {
        return;
      }

      const { default: ReactRefreshRspackPlugin } = await import(
        // @ts-expect-error
        '@rspack/plugin-react-refresh'
      );

      chain
        .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
        .use(ReactRefreshRspackPlugin);
    });
  },
});
