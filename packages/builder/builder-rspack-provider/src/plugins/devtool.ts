import { isUseJsSourceMap } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const PluginDevtool = (): BuilderPlugin => ({
  name: 'builder-plugin-devtool',

  setup(api) {
    api.modifyRspackConfig((rspackConfig, { isProd }) => {
      const config = api.getNormalizedConfig();

      if (!isUseJsSourceMap(config)) {
        rspackConfig.devtool = false;
      } else {
        const devtool = isProd
          ? // hide the source map URL in production to avoid Chrome warning
            'hidden-source-map'
          : 'cheap-module-source-map';
        rspackConfig.devtool = devtool;
      }
    });
  },
});
