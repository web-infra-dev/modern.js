import type { ServerPluginLegacy } from '../../../types';
import { run } from '../helper/storage';

export const honoContextPlugin = (): ServerPluginLegacy => ({
  name: '@modern-js/plugin-hono-context',

  setup(api) {
    return {
      prepare() {
        const { middlewares } = api.useAppContext();

        middlewares.push({
          name: 'hono-context',
          handler: run,
          order: 'pre',
        });
      },
    };
  },
});
