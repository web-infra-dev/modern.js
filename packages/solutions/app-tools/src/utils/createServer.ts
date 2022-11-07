import { Server, ModernDevServerOptions } from '@modern-js/server';
import type { InternalPlugins } from '@modern-js/types';

let server: Server | null = null;

export const getServer = () => server;

export const closeServer = async () => {
  if (server) {
    await server.close();
    server = null;
  }
};

export const createServer = async (options: ModernDevServerOptions) => {
  if (server) {
    await server.close();
  }
  server = new Server(options);

  const app = await server.init();

  return app;
};

export const injectDataLoaderPlugin = (internalPlugins: InternalPlugins) => {
  const DataLoaderPlugin = require.resolve(
    '@modern-js/plugin-data-loader/server',
  );
  return {
    ...internalPlugins,
    '@modern-js/plugin-data-loader': {
      path: DataLoaderPlugin,
      forced: true,
    },
  };
};
