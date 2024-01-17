import { Hono, Context } from 'hono';
import { ServerCore } from './ServerCore';
import { HonoNodeEnv } from './adapters/hono';
import { ServerCoreOptions } from './type';
import { createNodeServer } from './adapters/node';

export { ServerCoreOptions, createNodeServer };

export async function createServerBase(
  options: Omit<ServerCoreOptions, 'app'>,
) {
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
