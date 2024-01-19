import { Server as NodeServer } from 'node:http';
import path from 'path';
import type { ServerCoreOptions } from '@modern-js/server-core/base';
import {
  createServerBase,
  createNodeServer,
  createStaticMiddleware,
  createRenderHandler,
  favionFallbackMiddleware,
} from '@modern-js/server-core/base';

export default async (
  options: Omit<ServerCoreOptions, 'app'>,
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
    for (const route of routes) {
      const { entryPath } = route;

      const handler = await createRenderHandler({
        distDir,
        routeInfo: route,
        staticGenerate: options.staticGenerate,
        forceCSR,
        metaName: options.metaName || 'modern.js',
      });

    // TODO: inject custom server hooks
    server.get(entryPath, handler);
  }

  return nodeServer;
};
