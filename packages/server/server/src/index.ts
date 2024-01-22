import {
  DevServer as Server,
  DevServerForRsbuild as ServerForRsbuild,
} from './server';
import type {
  ModernDevServerOptions,
  ModernDevServerOptionsNew,
} from './types';

export { createDevServer } from './createDevServer';
export { Server, ServerForRsbuild };
export type { ModernDevServerOptions, ModernDevServerOptionsNew };

// TODO: it seems not used in any pkgs?
export default (options: ModernDevServerOptions): Promise<Server> => {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const server = new Server(options);

  return server.init();
};
