import { posix } from 'path';
import {
  setConfig,
  getDistPath,
  getFilename,
  applyBuilderOutputPlugin,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const builderPluginOutput = (): BuilderPlugin => ({
  name: 'builder-plugin-output',

  setup(api) {
    applyBuilderOutputPlugin(api);

    api.modifyRspackConfig(async (rspackConfig, { isProd }) => {
      const config = api.getNormalizedConfig();

      const cssPath = getDistPath(config.output, 'css');
      const cssFilename = getFilename(config.output, 'css', isProd);

      rspackConfig.output ||= {};
      rspackConfig.output.cssFilename = posix.join(cssPath, cssFilename);
      rspackConfig.output.cssChunkFilename = posix.join(
        cssPath,
        `async/${cssFilename}`,
      );

      if (config.output.copy) {
        const { copy } = config.output;
        const options = Array.isArray(copy) ? { patterns: copy } : copy;

        setConfig(rspackConfig, 'builtins.copy', {
          ...options,
          patterns: [
            ...(rspackConfig?.builtins?.copy?.patterns || []),
            ...options.patterns,
          ],
        });
      }
    });
  },
});
