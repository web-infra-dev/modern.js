import { join } from 'path';
import {
  getDistPath,
  getFilename,
  setConfig,
  resourceRuleFallback,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const builderPluginFallback = (): BuilderPlugin => ({
  name: 'builder-plugin-fallback',

  setup(api) {
    api.modifyRspackConfig((config, { isProd }) => {
      const builderConfig = api.getNormalizedConfig();

      if (!builderConfig.output.enableAssetFallback) {
        return;
      }

      const distDir = getDistPath(builderConfig.output, 'media');
      const filename = getFilename(builderConfig.output, 'media', isProd);

      setConfig(config, 'output.assetModuleFilename', join(distDir, filename));

      if (!config.module) {
        return;
      }

      setConfig(
        config,
        'module.rules',
        // rspack RuleSetRule is not exactly aligned with webpack. But it doesn't matter in resourceRuleFallback.
        // @ts-expect-error
        resourceRuleFallback(config.module?.rules),
      );
    });
  },
});
