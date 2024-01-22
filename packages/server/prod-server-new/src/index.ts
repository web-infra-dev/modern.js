import { Server as NodeServer } from 'node:http';
import path from 'path';
import { existsSync } from 'fs';
import type { ServerBaseOptions } from '@modern-js/server-core/base';
import {
  createServerBase,
  createNodeServer,
  createStaticMiddleware,
  createRenderHandler,
  favionFallbackMiddleware,
  CustomServer,
} from '@modern-js/server-core/base';
import { SERVER_DIR } from '@modern-js/utils';

export default async (
  options: Omit<ServerBaseOptions, 'app'>,
): Promise<NodeServer> => {
  const { config, pwd, routes } = options;
  const distDir = path.resolve(pwd, config.output.path || 'dist');

  const server = await createServerBase(options);

  const staticMiddleware = createStaticMiddleware({
    distDir,
    output: config?.output || {},
    html: config?.html || {},
  });

  server.get('*', staticMiddleware);
  server.get('*', favionFallbackMiddleware);

  await server.init();
  const nodeServer = createNodeServer(server.handle.bind(server));
  await server.afterInitNodeServer({ server: nodeServer });

  // registe render handler
  // TODO: get server config from server.ssr & server.ssrByEntries
  const ssrConfig = config.server?.ssr;
  const forceCSR = typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;
  if (routes) {
    const customServer = new CustomServer(server.runner, distDir);

    for (const route of routes) {
      const { entryPath, entryName } = route;

      const handler = await createRenderHandler({
        distDir,
        routeInfo: route,
        staticGenerate: options.staticGenerate,
        forceCSR,
        metaName: options.metaName || 'modern.js',
      });

      const customServerHookMiddleware = customServer.getHookMiddleware(
        entryName || 'main',
      );

      server.use(entryPath, customServerHookMiddleware);

      const serverDir = path.join(distDir, SERVER_DIR);

      // TODO: onlyApi
      if (existsSync(serverDir)) {
        const customServerMiddleware = customServer.getServerMiddleware();
        server.use(entryPath, customServerMiddleware);
      }

      server.get(entryPath, handler);
    }
  }

  return nodeServer;
};
