import { ModernServerOptions } from './type';
import { Server } from './server';

export type { SSRServerContext } from './libs/render/type';
export { Server };
export type { ModernServerOptions };

export default (options: ModernServerOptions): Promise<Server> => {
  if (options == null) {
    throw new Error('can not start mserver without options');
  }

  const server = new Server(options);

  return server.init();
};
