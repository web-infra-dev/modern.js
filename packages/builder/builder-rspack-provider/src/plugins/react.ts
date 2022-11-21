import type { BuilderPlugin } from '../types';
import _ from '@modern-js/utils/lodash';

export const PluginReact = (): BuilderPlugin => ({
  name: 'builder-plugin-react',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, { isProd, target }) => {
      const config = api.getNormalizedConfig();

      const isUsingHMR =
        !isProd &&
        target !== 'node' &&
        // target !== 'web-worker' &&
        config.dev.hmr;

      // todo: no type check
      _.set(rspackConfig, 'builtins.react', {
        development: !isProd,
        refresh: isUsingHMR,
      });
    });
  },
});
