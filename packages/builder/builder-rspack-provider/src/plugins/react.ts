import type { BuilderPlugin } from '../types';
import { setConfig } from '@modern-js/builder-shared';
import { isUsingHMR } from './hmr';

export const builderPluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, utils) => {
      const config = api.getNormalizedConfig();

      const usingHMR = isUsingHMR(config, utils);

      // fix rspack bug temp
      setConfig(rspackConfig, 'builtins.treeShaking', false);

      setConfig(rspackConfig, 'builtins.react', {
        development: !utils.isProd,
        refresh: usingHMR,
        // https://swc.rs/docs/configuration/compilation#jsctransformreactruntime
        runtime: 'automatic',
      });
    });
  },
});
