/* eslint-disable consistent-return */
import path from 'path';
import fs from 'fs';
import type { ServerPlugin } from '@modern-js/server-core';
import type { ServerRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME, SERVER_BUNDLE_DIRECTORY } from '@modern-js/utils';

import { matchEntry, ServerContext } from '../runtime';

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-data-loader',
  setup: () => ({
    prepareLoaderHandler({
      serverRoutes,
      distDir,
    }: {
      serverRoutes: ServerRoute[];
      distDir: string;
    }) {
      return async (context: ServerContext) => {
        const entry = matchEntry(context.path, serverRoutes);
        if (!entry) {
          return;
        }
        const routesPath = path.join(
          distDir,
          SERVER_BUNDLE_DIRECTORY,
          `${entry.entryName || MAIN_ENTRY_NAME}-server-loaders.js`,
        );

        // legacy ssr does not contain server loaders
        if (!fs.existsSync(routesPath)) {
          return;
        }

        const { routes, handleRequest } = await import(routesPath);

        if (!routes) {
          return;
        }

        return handleRequest({
          serverRoutes,
          context,
          routes,
        });
      };
    },
  }),
});
/* eslint-enable consistent-return */
