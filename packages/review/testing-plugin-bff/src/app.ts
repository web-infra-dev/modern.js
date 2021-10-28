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
  const server = new Server({
    apiOnly: true,
    pwd,
    config,
    plugins,
    routes,
  });

  await server.init();

  (server as any).server.addHandler((_ctx: any, next: any) => {
    store.run('in handler', () => {
      next();
    });
  });

  return (server as any).app;
};

export { createApp };
