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
        const basicTarget = target === 'web-worker' ? 'webworker' : 'web';

        if (browserslist) {
          rspackConfig.target = [basicTarget, 'browserslist'];
        } else if (target === 'modern-web') {
          rspackConfig.target = [basicTarget, 'es2015'];
        } else {
          rspackConfig.target = [basicTarget, 'es5'];
        }
      }
    });
  },
});
