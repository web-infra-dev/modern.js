import type { BuilderPlugin } from '../types';
import { setConfig, isUsingHMR } from '@modern-js/builder-shared';

export const builderPluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, utils) => {
      const config = api.getNormalizedConfig();

      const usingHMR = isUsingHMR(config, utils);

      setConfig(rspackConfig, 'builtins.react', {
        development: !utils.isProd,
        refresh: usingHMR,
        // https://swc.rs/docs/configuration/compilation#jsctransformreactruntime
        runtime: 'automatic',
      });
    });

    api.modifyBundlerChain(async (chain, utils) => {
      const config = api.getNormalizedConfig();

      const usingHMR = isUsingHMR(config, utils);

      const { bundler } = utils;

      if (usingHMR) {
        chain.plugin('ReactRefreshRuntime').use(bundler.ProvidePlugin, [
          {
            $ReactRefreshRuntime$: [
              require.resolve('@rspack/dev-client/react-refresh'),
            ],
          },
        ]);
      }
    });
  },
});
