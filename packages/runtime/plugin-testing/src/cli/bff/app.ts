import { AsyncLocalStorage } from 'async_hooks';
import path from 'node:path';
import { createProdServer } from '@modern-js/prod-server';
import { InternalPlugins } from '@modern-js/types';

const store = new AsyncLocalStorage();
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export const isInHandler = () => Boolean(store.getStore());
let server: UnwrapPromise<ReturnType<typeof createProdServer>>;

const createApp = async (
  pwd: string,
  config: any,
  plugins: InternalPlugins,
  routes: any[],
) => {
  if (!server) {
    config.output.path = './';
    server = await createProdServer({
      pwd,
      config,
      internalPlugins: plugins,
      routes,
      appContext: {
        apiDirectory: path.join(pwd, 'api'),
        lambdaDirectory: path.join(pwd, 'api', 'lambda'),
      },
    });
  }

  const app = server.getRequestListener();

  return app;
};

const getApp = () => {
  if (!server) {
    throw new Error('please createApp first');
  }
  return server.getRequestListener();
};

const closeServer = async () => {
  if (!server) {
    throw new Error('please createApp first');
  }
  server.close();
};

export { createApp, getApp, closeServer };
