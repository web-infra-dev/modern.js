import { AsyncLocalStorage } from 'async_hooks';
import { Server } from '@modern-js/server';

const store = new AsyncLocalStorage();

export const isInHandler = () => Boolean(store.getStore());

const createApp = async (
  pwd: string,
  config: any,
  plugins: any[],
  routes: any[],
) => {
  config.output.path = './';
  const server = new Server({
    apiOnly: true,
    dev: {
      watch: false,
    },
    pwd,
    config,
    plugins,
    routes,
  });

  await server.init();

  return server.getRequestHandler();
};

export { createApp };
