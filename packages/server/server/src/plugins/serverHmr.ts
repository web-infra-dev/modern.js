import path from 'path';
import type { ServerPlugin } from '@modern-js/server-core';

export default (reload: () => Promise<void>): ServerPlugin => ({
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
          await reload();
        }
      }
    });
  },
});
