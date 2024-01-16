import { Server as NodeServer } from 'http';
import { Hono } from 'hono';
import { ModernServerOptions } from './type';
import { Server } from './Server';
import { createNodeServer } from './adapters/node';
import { NodeRequest, NodeResponse } from './adapters/types';

export default async (
  options: Omit<ModernServerOptions, 'core'>,
): Promise<NodeServer> => {
  if (options == null) {
    throw new Error('can not start server without options');
  }

  type Bindings = {
    node?: {
      req: NodeRequest;
      res: NodeResponse;
    };
  };

  const hono = new Hono<{ Bindings: Bindings }>();

  const server = new Server({
    ...options,
    core: {
      ...hono,
      handle: hono.fetch,
    },
  });

  await server.init();

  const nodeServer = createNodeServer(server.handle.bind(server));

  return nodeServer;
};
