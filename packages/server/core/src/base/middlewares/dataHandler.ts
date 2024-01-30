import path from 'node:path';
import type { ServerRoute, NestedRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME, SERVER_BUNDLE_DIRECTORY } from '@modern-js/utils';
import { Middleware } from '../types';
import type { ServerBase } from '../serverBase';

type ServerLoaderModule = {
  routes: NestedRoute[];
  handleRequest: (options: {
    request: Request;
    serverRoutes: ServerRoute[];
    context: any;
    routes: NestedRoute[];
  }) => Promise<any>;
};

export const bindDataHandlers = (
  server: ServerBase,
  routes: ServerRoute[],
  distDir: string,
) => {
  return Promise.all(
    routes.map(async route => {
      const bundlePath = path.join(
        distDir,
        SERVER_BUNDLE_DIRECTORY,
        `${route.entryName || MAIN_ENTRY_NAME}-server-loaders.js`,
      );
      server.all(`${route.urlPath}/*`, createDataHandler(routes, bundlePath));
    }),
  );
};

export const createDataHandler = (
  serverRoutes: ServerRoute[],
  buildModulePath: string,
): Middleware => {
  return async (context, next) => {
    const buildModule = (await import(buildModulePath)) as ServerLoaderModule;
    const { routes, handleRequest } = buildModule;

    const logger = context.get('logger');
    const reporter = context.get('reporter');
    const response = (await handleRequest({
      request: context.req.raw,
      serverRoutes,
      context: {
        logger,
        reporter,
      },
      routes,
    })) as Response | void;

    if (typeof response !== 'undefined') {
      context.res = response;
    }

    await next();
  };
};
