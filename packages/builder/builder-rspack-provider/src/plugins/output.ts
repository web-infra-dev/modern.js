import {
  getDistPath,
  getFilename,
  applyBuilderOutputPlugin,
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

        rspackConfig.output.cssFilename = `${cssPath}/${cssFilename}`;
        rspackConfig.output.cssChunkFilename = `${cssPath}/async/${cssFilename}`;
      }
    });
  },
});
