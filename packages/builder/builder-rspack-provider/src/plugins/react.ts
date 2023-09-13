import type { BuilderPlugin } from '../types';
import { setConfig, isUsingHMR } from '@modern-js/builder-shared';

export const builderPluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  pre: ['builder-plugin-swc-loader'],

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID, isProd, target }) => {
      const config = api.getNormalizedConfig();
      const usingHMR = isUsingHMR(config, { isProd, target });

      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .use(CHAIN_ID.USE.SWC)
        .tap(options => {
          options.rspackExperiments ??= {};
          options.rspackExperiments.react = {
            development: !isProd,
            refresh: usingHMR,
            // https://swc.rs/docs/configuration/compilation#jsctransformreactruntime
            runtime: 'automatic',
          };
          return options;
        });
    });
    api.modifyRspackConfig(async rspackConfig => {
      setConfig(rspackConfig, 'builtins.provide', {
        ...(rspackConfig.builtins?.provide || {}),
        $ReactRefreshRuntime$: [
          require.resolve('@rspack/dev-client/react-refresh'),
        ],
      });
    });
  },
});
