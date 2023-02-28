import type { BuilderPlugin } from '../types';

import { setConfig, isUsingHMR } from '@modern-js/builder-shared';

export const builderPluginHMR = (): BuilderPlugin => ({
  name: 'builder-plugin-hmr',

  setup(api) {
    api.modifyRspackConfig((rspackConfig, utils) => {
      const config = api.getNormalizedConfig();

      const usingHMR = isUsingHMR(config, utils);

      setConfig(rspackConfig, 'devServer.hot', usingHMR);
    });
  },
});
