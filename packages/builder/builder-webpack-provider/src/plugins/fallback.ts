import { join } from 'path';
import {
  getDistPath,
  getFilename,
  resourceRuleFallback,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const builderPluginFallback = (): BuilderPlugin => ({
  name: 'builder-plugin-fallback',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd }) => {
      const builderConfig = api.getNormalizedConfig();

      if (builderConfig.output.enableAssetFallback) {
        const distDir = getDistPath(builderConfig.output, 'media');
        const filename = getFilename(builderConfig.output, 'media', isProd);

        chain.output.merge({
          assetModuleFilename: join(distDir, filename),
        });
      }
    });

    api.modifyWebpackConfig(config => {
      const builderConfig = api.getNormalizedConfig();

      if (!builderConfig.output.enableAssetFallback || !config.module) {
        return;
      }

      config.module.rules = resourceRuleFallback(config.module.rules);
    });
  },
});
