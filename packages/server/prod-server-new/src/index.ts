import { Server as NodeServer } from 'node:http';
import type { ServerCoreOptions } from '@modern-js/server-base';
import {
  createServerBase,
  createNodeServer,
  createStaticMiddleware,
} from '@modern-js/server-base';

export default async (
  options: Omit<ServerCoreOptions, 'app'>,
): Promise<NodeServer> => {
  const { config, pwd } = options;
  const server = await createServerBase(options);

  const staticMiddleware = createStaticMiddleware({
    pwd,
    output: config?.output || {},
    html: config?.html || {},
  });

  server.use(staticMiddleware);

  await server.init();
  const nodeServer = createNodeServer(server.handle.bind(server));
  await server.afterInitNodeServer({ server: nodeServer });

  return nodeServer;
};
