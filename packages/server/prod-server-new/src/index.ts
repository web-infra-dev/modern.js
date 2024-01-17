import { Server as NodeServer } from 'http';
import { Hono, Context } from 'hono';
import { ServerCore } from './ServerCore';
import { createNodeServer } from './adapters/node';
import { HonoNodeEnv } from './adapters/hono';
import { ServerCoreOptions } from './type';

async function createServer(options: Omit<ServerCoreOptions, 'app'>) {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  const hono = new Hono<HonoNodeEnv>();

  const server = new ServerCore<Context<HonoNodeEnv>>({
    ...options,
    app: {
      ...hono,
      handle: hono.fetch,
    },
  });

  await server.init();

  return server;
}

export default async (
  options: Omit<ServerCoreOptions, 'app'>,
): Promise<NodeServer> => {
  const server = await createServer(options);
  const nodeServer = createNodeServer(server.handle.bind(server));

  return nodeServer;
};
