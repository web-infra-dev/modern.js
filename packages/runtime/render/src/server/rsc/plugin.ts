import { matchEntry } from '@modern-js/runtime-utils/node';
import type { ServerPlugin } from '@modern-js/server-core';

const MAIN_ENTRY_NAME = 'main';

export default (): ServerPlugin => ({
  name: 'rsc-server-plugin',
  setup(api) {
    return {
      prepare() {
        const { middlewares, routes } = api.useAppContext();
        middlewares.unshift({
          name: 'rsc-action',
          method: 'post',
          path: '/',
          handler: async (c, next) => {
            if (!routes) {
              return next();
            }
            const entry = matchEntry(c.req.path, routes);
            if (!entry) {
              return new Response('Cannot find a valid entry', {
                status: 404,
              });
            }
            const serverManifest = c.get('serverManifest');
            const serverBundle =
              serverManifest?.renderBundles?.[
                entry.entryName || MAIN_ENTRY_NAME
              ];

            if (!serverBundle) {
              return new Response('Server bundle not found', { status: 500 });
            }

            const { handleAction } = serverBundle;
            if (!handleAction) {
              return new Response('Cannot find server action handler', {
                status: 500,
              });
            }

            const rscClientManifest = c.get('rscClientManifest');

            if (!rscClientManifest) {
              return new Response('Cannot find rsc client manifest', {
                status: 500,
              });
            }

            return handleAction(c.req, { clientManifest: rscClientManifest });
          },
        });
      },
    };
  },
});
