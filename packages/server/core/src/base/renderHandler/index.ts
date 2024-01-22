import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { SERVER_DIR, cutNameByHyphen } from '@modern-js/utils';
import { ServerRoute } from '@modern-js/types';
import { HonoRequest, Middleware, ServerBaseOptions } from '../types';
import { ServerBase } from '../serverBase';
import { CustomServer } from '../middlewares';
import { createSSRHandler } from './ssrHandler';

export interface CreateRenderHOptions {
  routeInfo: ServerRoute;
  distDir: string;
  metaName: string;

  // for use-loader api when ssg
  staticGenerate?: boolean;
  forceCSR?: boolean;
}

async function createRenderHandler(
  options: CreateRenderHOptions,
): Promise<Middleware> {
  const {
    forceCSR,
    metaName,
    routeInfo,
    distDir,
    staticGenerate = false,
  } = options;

  const htmlPath = path.join(distDir, routeInfo.entryPath);
  const html = await readFile(htmlPath, 'utf-8');

  return async (c, _) => {
    const renderMode = getRenderMode(
      c.req,
      metaName,
      routeInfo.isSSR,
      forceCSR,
    );

    const handler =
      renderMode === 'csr'
        ? createCSRHandler(html)
        : await createSSRHandler({
            distDir,
            html,
            staticGenerate,
            mode: routeInfo.isStream ? 'stream' : 'string',
            routeInfo,
            metaName,
          });

    return handler(c, _);
  };
}

function createCSRHandler(html: string): Middleware {
  return async c => {
    return c.html(html);
  };
}

function getRenderMode(
  req: HonoRequest,
  framework: string,
  isSSR?: boolean,
  forceCSR?: boolean,
): 'ssr' | 'csr' {
  if (isSSR) {
    if (
      forceCSR &&
      (req.query('csr') ||
        req.header(`x-${cutNameByHyphen(framework)}-ssr-fallback`))
    ) {
      return 'csr';
    }
    return 'ssr';
  } else {
    return 'csr';
  }
}

export async function bindRenderHandler(
  server: ServerBase,
  distDir: string,
  options: Omit<ServerBaseOptions, 'app'>,
) {
  const { config, routes } = options;

  const { runner } = server;
  if (routes) {
    // TODO: get server config from server.ssr & server.ssrByEntries
    const ssrConfig = config.server?.ssr;
    const forceCSR = typeof ssrConfig === 'object' ? ssrConfig.forceCSR : false;
    const customServer = new CustomServer(runner, distDir);

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
      // FIXME: bind with node runtime
      if (existsSync(serverDir)) {
        const customServerMiddleware = customServer.getServerMiddleware();
        server.use(entryPath, customServerMiddleware);
      }

      server.get(entryPath, handler);
    }
  }
}
