import { getBrowserslist } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const PluginTarget = (): BuilderPlugin => ({
  name: 'builder-plugin-target',

  setup(api) {
    api.modifyWebpackChain(async (chain, { target }) => {
      if (target === 'node') {
        chain.target('node');
        return;
      }

      const browserslist = await getBrowserslist(api.context.rootPath);
      const basicTarget = target === 'web-worker' ? 'webworker' : 'web';

      if (browserslist) {
        chain.merge({ target: [basicTarget, 'browserslist'] });
      } else if (target === 'modern-web') {
        chain.merge({ target: [basicTarget, 'es6'] });
      } else {
        chain.merge({ target: [basicTarget, 'es5'] });
      }
    });
  },
});
