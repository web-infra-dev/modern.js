import type { BuilderPlugin } from '../types';
import _ from '@modern-js/utils/lodash';

export const PluginProgress = (): BuilderPlugin => ({
  name: 'builder-plugin-progress',
  setup(api) {
    api.modifyRspackConfig(async rspackConfig => {
      const config = api.getNormalizedConfig();
      const options = config.dev.progressBar;
      if (!options) {
        return;
      }

      _.set(rspackConfig, 'builtins.progress', {});
    });
  },
});
