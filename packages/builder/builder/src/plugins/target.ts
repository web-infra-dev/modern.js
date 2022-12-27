import { getBrowserslist } from '@modern-js/builder-shared';
import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';

export const PluginTarget = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-target',

  setup(api) {
    api.modifyBundlerChain(async (chain, { target }) => {
      if (target === 'node') {
        chain.target('node');
        return;
      }

      const browserslist = await getBrowserslist(api.context.rootPath);
      const basicTarget = target === 'web-worker' ? 'webworker' : 'web';

      if (browserslist) {
        chain.merge({ target: [basicTarget, 'browserslist'] });
      } else if (target === 'modern-web') {
        chain.merge({ target: [basicTarget, 'es2015'] });
      } else {
        chain.merge({ target: [basicTarget, 'es5'] });
      }
    });
  },
});
