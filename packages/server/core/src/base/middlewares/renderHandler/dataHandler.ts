import type { ServerRoute, NestedRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME, SERVER_BUNDLE_DIRECTORY } from '@modern-js/utils';
import { getPathModule } from '../../utils';
import { SSRRenderOptions } from './ssrRender';

type ServerLoaderModule = {
  routes: NestedRoute[];
  handleRequest: (options: {
    request: Request;
    serverRoutes: ServerRoute[];
    context: any;
    routes: NestedRoute[];
  }) => Promise<any>;
};

export const dataHandler = async (
  request: Request,
  {
    routeInfo,
    serverRoutes,
    pwd,
    reporter,
    logger,
  }: SSRRenderOptions & {
    serverRoutes: ServerRoute[];
  },
): Promise<Response | void> => {
  const path = await getPathModule();
  const serverLoaderBundlePath = path.join(
    pwd,
    SERVER_BUNDLE_DIRECTORY,
    `${routeInfo.entryName || MAIN_ENTRY_NAME}-server-loaders.js`,
  );

  let serverLoaderModule: ServerLoaderModule;
  try {
    serverLoaderModule = await import(serverLoaderBundlePath);
  } catch (_) {
    return;
  }

  const { routes, handleRequest } = serverLoaderModule;
  const response = (await handleRequest({
    request,
    serverRoutes,
    context: {
      logger,
      reporter,
    },
    routes,
  })) as Response | void;

  // eslint-disable-next-line consistent-return
  return response;
};
