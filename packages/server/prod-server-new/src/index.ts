import { Server as NodeServer } from 'node:http';
import type { ServerCoreOptions } from '@modern-js/server-base';
import { createServerBase, createNodeServer } from '@modern-js/server-base';

export default async (
  options: Omit<ServerCoreOptions, 'app'>,
): Promise<NodeServer> => {
  const server = await createServerBase(options);
  const nodeServer = createNodeServer(server.handle.bind(server));

  return nodeServer;
};
