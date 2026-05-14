import { compress } from 'hono/compress';
import type { ServerPlugin } from '../types';

export const compressionPlugin = (): ServerPlugin => ({
  name: '@modern-js/plugin-compression',
  setup(api) {
    api.onPrepare(() => {
      const { middlewares, serverConfig } = api.getServerContext();
      const compression = serverConfig?.server?.compression;

      if (!compression) {
        return;
      }

      const encoding =
        typeof compression === 'object' && compression.encoding
          ? compression.encoding
          : 'gzip';

      middlewares.push({
        name: 'compression',
        handler: compress({ encoding }),
        order: 'pre',
      });
    });
  },
});
