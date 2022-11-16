import type { BuilderPlugin } from '../types';
import _ from '@modern-js/utils/lodash';

export const PluginMinimize = (): BuilderPlugin => ({
  name: 'builder-plugin-minimize',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, { isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize = isProd && !config.output.disableMinimize;

      _.set(rspackConfig, 'builtins.minify', isMinimize);
    });
  },
});
