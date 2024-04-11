import type { ServerRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import { SSRRenderOptions } from './ssrRender';

export const dataHandler = async (
  request: Request,
  {
    routeInfo,
    serverRoutes,
    reporter,
    logger,
    serverManifest,
  }: SSRRenderOptions & {
    serverRoutes: ServerRoute[];
  },
): Promise<Response | void> => {
  const serverLoaderModule =
    serverManifest?.loaderBundles?.[routeInfo.entryName || MAIN_ENTRY_NAME];

  if (!serverLoaderModule) {
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
