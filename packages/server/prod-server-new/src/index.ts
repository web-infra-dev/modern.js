import { Server as NodeServer } from 'http';
import { ServerCoreOptions } from './type';
import { ServerCore } from './core';
import { createNodeServer } from './adapters/node';

async function createServer(options: ServerCoreOptions) {
  const server = new ServerCore(options);

  // server.use(otherMiddlewars )

  await server.init();

  return server;
}

export default async (options: ServerCoreOptions): Promise<NodeServer> => {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const server = await createServer(options);

  const nodeServer = createNodeServer(server.handle.bind(server));

  return nodeServer;
};
