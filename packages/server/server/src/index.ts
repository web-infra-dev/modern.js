import { DevServer as Server, DevServerForRsbuild } from './server';
import type { ModernDevServerOptions } from './types';

export { Server };
export type { ModernDevServerOptions };

export default (options: ModernDevServerOptions): Promise<Server> => {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const server = new Server(options);

  return server.init();
};

export const ModernRsbuildServer = (
  options: ModernDevServerOptions,
): Promise<Server> => {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const server = new DevServerForRsbuild(options);

  return server.init();
};
