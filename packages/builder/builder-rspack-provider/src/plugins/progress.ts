import { setConfig, TARGET_ID_MAP } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const PluginProgress = (): BuilderPlugin => ({
  name: 'builder-plugin-progress',
  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, { target }) => {
      const config = api.getNormalizedConfig();
      const options = config.dev.progressBar;

      if (!options) {
        return;
      }

      setConfig(rspackConfig, 'builtins.progress', {
        prefix: TARGET_ID_MAP[target],
        ...(options === true ? {} : options),
      });
    });
  },
});
