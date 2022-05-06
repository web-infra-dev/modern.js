import { ModernServerOptions } from './type';
import { Server } from './server';

export { Server };
export type { ServerConfig } from '@modern-js/server-core';
export { ModernServer } from './server/modern-server';
export { createProxyHandler } from './libs/proxy';
export * from './type';
export * from './constants';

export default (options: ModernServerOptions): Promise<Server> => {
  if (options == null) {
    throw new Error('can not start mserver without options');
  }

  const server = new Server(options);

  return server.init();
};
