import path from 'path';
import type { ServerPluginLegacy } from '@modern-js/server-core';
import { restart } from '../utils/createServer';

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
            await restart();
          }
        }
      },
    };
  },
});
