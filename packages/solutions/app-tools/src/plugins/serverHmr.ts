import path from 'path';
import type { ServerPlugin } from '@modern-js/server-core';
import { reloadServer } from '../utils/createServer';

import type { AppTools, CliPlugin } from '../types';

export const serverHmrPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/server-hmr-plugin',
  setup(api) {
    api._internalServerPlugins(({ plugins }) => {
      if (process.env.NODE_ENV === 'development') {
        plugins.push({
          name: '@modern-js/app-tools/server/hmr',
        });
      }
      return { plugins };
    });
  },
});

export default (): ServerPlugin => ({
  name: '@modern-js/server-hmr-plugin',
  setup: api => {
    api.onReset(async ({ event }) => {
      if (event.type === 'file-change') {
        const { appDirectory } = api.getServerContext();
        const serverPath = path.join(appDirectory, 'server');
        const indexPath = path.join(serverPath, 'index');
        const isServerFileChanged = event.payload.some(
          ({ filename }) =>
            filename.startsWith(serverPath) && !filename.startsWith(indexPath),
        );
        if (isServerFileChanged) {
          await reloadServer?.();
        }
      }
    });
  },
});
