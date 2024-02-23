import type { ServerRoute, NestedRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME, SERVER_BUNDLE_DIRECTORY } from '@modern-js/utils';
import { getPathModule, sortRoutes } from '../utils';
import { Middleware } from '../../core/server';
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

export const bindDataHandlers = async (
  server: ServerBase,
  routes: ServerRoute[],
  distDir: string,
) => {
  const path = await getPathModule();
  routes.sort(sortRoutes).forEach(route => {
    const bundlePath = path.join(
      distDir,
      SERVER_BUNDLE_DIRECTORY,
      `${route.entryName || MAIN_ENTRY_NAME}-server-loaders.js`,
    );

    server.all(
      `${route.urlPath === '/' ? '*' : `${route.urlPath}/*`}`,
      createDataHandler(routes, bundlePath),
    );
  });
};

const createDataHandler = (
  serverRoutes: ServerRoute[],
  buildModulePath: string,
): Middleware => {
  return async (context, next) => {
    let buildModule: ServerLoaderModule;

    try {
      buildModule = await import(buildModulePath);
    } catch (_) {
      // we should call next(), if we import buildModule occur error,
      return next();
    }
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

    return response ? response : next();
  };
};
