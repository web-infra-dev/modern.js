import { Server, ModernDevServerOptionsOld } from '@modern-js/server';

let server: Server | null = null;

export const getServer = () => server;

export const setServer = (newServer: Server) => {
  server = newServer;
};

export const closeServer = async () => {
  if (server) {
    await server.close();
    server = null;
  }
};

export const createServer = async (options: ModernDevServerOptionsOld) => {
  if (server) {
    await server.close();
  }
  server = new Server(options);

  const app = await server.init();

  return app;
};
