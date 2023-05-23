import { posix } from 'path';
import {
  getDistPath,
  getFilename,
  applyBuilderOutputPlugin,
  setConfig,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';
import { isUseCssExtract } from '../shared';

export const builderPluginOutput = (): BuilderPlugin => ({
  name: 'builder-plugin-output',

  setup(api) {
    applyBuilderOutputPlugin(api);

    api.modifyRspackConfig(async (rspackConfig, { isProd, target }) => {
      const config = api.getNormalizedConfig();

      rspackConfig.output = rspackConfig.output || {};
      // css output
      if (isUseCssExtract(config, target)) {
        const cssPath = getDistPath(config.output, 'css');
        const cssFilename = getFilename(config.output, 'css', isProd);

        rspackConfig.output.cssFilename = posix.join(cssPath, cssFilename);
        rspackConfig.output.cssChunkFilename = posix.join(
          cssPath,
          `async/${cssFilename}`,
        );
      }

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
