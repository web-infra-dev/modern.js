import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import type { RscPayloadHandlerOptions } from '../../types/server';
import type { SSRRenderOptions } from './ssrRender';
import { createRequestHandlerConfig } from './utils';

export const csrRscRender = async (req: Request, options: SSRRenderOptions) => {
  const {
    routeInfo,
    serverManifest,
    rscSSRManifest,
    rscClientManifest,
    rscServerManifest,
    locals,
    params,
    loaderContext,
    reporter,
    monitors,
    onError,
    onTiming,
    staticGenerate,
    html,
  } = options;

  const serverBundle =
    serverManifest?.renderBundles?.[routeInfo.entryName || MAIN_ENTRY_NAME];

  const loadableStats = serverManifest.loadableStats || {};
  const routeManifest = serverManifest.routeManifest || {};
  const config = createRequestHandlerConfig(options.config);

  const requestHandlerOptions: RscPayloadHandlerOptions = {
    resource: {
      route: routeInfo,
      loadableStats,
      routeManifest,
      entryName: routeInfo.entryName || MAIN_ENTRY_NAME,
    },
    config,
    params,
    loaderContext,
    html,

    rscSSRManifest,
    rscClientManifest,
    rscServerManifest,

    locals,
    staticGenerate,
    monitors,

    onError,
    onTiming,
    reporter: reporter,
  };

  if (!serverBundle) {
    return new Response('Cannot find server bundle for RSC', { status: 500 });
  }

  const renderRscStreamHandler = await serverBundle.renderRscStreamHandler;

  if (!renderRscStreamHandler) {
    return new Response('Cannot find render handler for RSC', { status: 500 });
  }

  if (!rscClientManifest) {
    return new Response('Cannot find rsc client manifest', { status: 500 });
  }

  const response = await renderRscStreamHandler(req, requestHandlerOptions);

  return response;
};
