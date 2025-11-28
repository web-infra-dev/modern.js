import type { ServerRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import type { SSRRenderOptions } from './ssrRender';

export const dataHandler = async (
  request: Request,
  {
    routeInfo,
    serverRoutes,
    monitors,
    onError,
    onTiming,
    serverManifest,
    loaderContext,
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
      monitors,
      loaderContext,
    },
    onTiming,
    onError,
    routes,
  })) as Response | void;

  return response;
};
