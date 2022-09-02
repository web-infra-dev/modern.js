import { DevServer as Server } from './server';
import type {
  DevServerOptions,
  DevServerHttpsOptions,
  ModernDevServerOptions,
} from './types';

export { Server };
export type { DevServerOptions, DevServerHttpsOptions, ModernDevServerOptions };

export default (options: ModernDevServerOptions): Promise<Server> => {
  if (options == null) {
    throw new Error('can not start mserver without options');
  }

  const server = new Server(options);

  return server.init();
};
