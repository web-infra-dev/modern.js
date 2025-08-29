import path from 'path';
import type { ServerPlugin } from '@modern-js/server-core';

import { serverReload } from '../createDevServer';

export default (): ServerPlugin => ({
  name: '@modern-js/server-reload-plugin',
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
          await serverReload?.();
        }
      }
    });
  },
});
