import { AsyncLocalStorage } from 'async_hooks';
import { Server } from '@modern-js/prod-server';

const store = new AsyncLocalStorage();

export const isInHandler = () => Boolean(store.getStore());
let server: Server | null = null;

const createApp = async (
  pwd: string,
  config: any,
  plugins: any[],
  routes: any[],
) => {
  if (!server) {
    config.output.path = './';
    server = new Server({
      apiOnly: true,
      pwd,
      config,
      plugins,
      routes,
    });

    await server.init();
  }

  const app = server.getRequestHandler();
  return app;
};

const getApp = () => {
  if (!server) {
    throw new Error('please createApp first');
  }
  return server.getRequestHandler();
};

const closeServer = async () => {
  if (!server) {
    throw new Error('please createApp first');
  }
  await server.close();
};

export { createApp, getApp, closeServer };
