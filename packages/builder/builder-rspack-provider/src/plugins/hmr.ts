import type {
  BuilderPlugin,
  NormalizedConfig,
  ModifyRspackConfigUtils,
} from '../types';
import { setConfig } from '@modern-js/builder-shared';

export const isUsingHMR = (
  config: NormalizedConfig,
  { isProd, target }: ModifyRspackConfigUtils,
) => !isProd && target !== 'node' && target !== 'web-worker' && config.dev.hmr;

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
