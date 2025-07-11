import path from 'path';
import type { ServerPluginLegacy } from '@modern-js/server-core';
import { reloadServer } from '../utils/createServer';

import type { AppTools, CliPluginFuture } from '../types';

export const serverHmrPlugin = (): CliPluginFuture<AppTools<'shared'>> => ({
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

export default (): ServerPluginLegacy => ({
  name: '@modern-js/server-hmr-plugin',
  setup: api => {
    return {
      async reset({ event }) {
        if (event.type === 'file-change') {
          const { appDirectory } = api.useAppContext();
          const serverPath = path.join(appDirectory, 'server');
          const indexPath = path.join(serverPath, 'index');
          const isServerFileChanged = event.payload.some(
            ({ filename }) =>
              filename.startsWith(serverPath) &&
              !filename.startsWith(indexPath),
          );
          if (isServerFileChanged) {
            await reloadServer?.();
          }
        }
      },
    };
  },
});
