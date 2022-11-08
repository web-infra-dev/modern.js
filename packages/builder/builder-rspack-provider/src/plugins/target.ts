import { getBrowserslist } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const PluginTarget = (): BuilderPlugin => ({
  name: 'builder-plugin-target',
  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, { target }) => {
      if (target === 'node') {
        rspackConfig.target = 'node';
      } else {
        const browserslist = await getBrowserslist(api.context.rootPath);
        if (browserslist) {
          rspackConfig.target = ['web', 'browserslist'];
        } else if (target === 'modern-web') {
          rspackConfig.target = ['web', 'es2015'];
        } else {
          rspackConfig.target = ['web', 'es2015'];
        }
      }
    });
  },
});
