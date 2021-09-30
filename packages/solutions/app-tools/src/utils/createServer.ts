import { Server, ModernServerOptions } from '@modern-js/server';

let server: Server;

export const createServer = async (options: ModernServerOptions) => {
  if (server) {
    await server.close();
  }

  // eslint-disable-next-line require-atomic-updates
  server = new Server(options);

  const app = await server.init();

  return app;
};
