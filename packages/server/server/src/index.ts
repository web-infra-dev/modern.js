import { ModernServerOptions } from './type';

import { Server } from './server';

export * from './type';
export * from './libs/context';
export * from './libs/route';
export type { SSRServerContext } from './libs/render/type';
export { Server };

export default (options: ModernServerOptions): Promise<Server> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const allowEnvs = ['production', 'development', 'test'];

  if (options == null) {
    throw new Error();
  }

  const server = new Server(options);

  return server.init();
};
