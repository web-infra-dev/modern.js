import { DevServer as Server } from './server';
import { ModernDevServerOptions } from './types';

export { Server };
export type { ModernDevServerOptions };

export default (options: ModernDevServerOptions): Promise<Server> => {
  if (options == null) {
    throw new Error('can not start mserver without options');
  }

  const server = new Server(options);

  return server.init();
};
