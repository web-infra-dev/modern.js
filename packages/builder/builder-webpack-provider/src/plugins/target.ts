import { getBrowserslist } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const PluginTarget = (): BuilderPlugin => ({
  name: 'builder-plugin-target',

  setup(api) {
    api.modifyWebpackChain(async (chain, { target }) => {
      if (target === 'node') {
        chain.target('node');
      } else {
        const browserslist = await getBrowserslist(api.context.rootPath);

        if (browserslist) {
          chain.merge({ target: ['web', 'browserslist'] });
        } else if (target === 'modern-web') {
          chain.merge({ target: ['web', 'es6'] });
        } else {
          chain.merge({ target: ['web', 'es5'] });
        }
      }
    });
  },
});
