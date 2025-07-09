import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import type { RscPayloadHandlerOptions } from '../../types/server';
import type { SSRRenderOptions } from './ssrRender';
import { createRequestHandlerConfig } from './utils';

export const renderRscHandler = async (
  req: Request,
  options: SSRRenderOptions,
) => {
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
    logger,
    metrics,
    onError,
    onTiming,
    staticGenerate,
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

    rscSSRManifest,
    rscClientManifest,
    rscServerManifest,

    locals,
    reporter,
    staticGenerate,
    logger,
    metrics,
    monitors,

    onError,
    onTiming,
  };

  if (!serverBundle) {
    return new Response('Cannot find server bundle for RSC', { status: 500 });
  }

  const rscRequestHandler = await serverBundle.rscRequestHandler;

  if (!rscRequestHandler) {
    return new Response('Cannot find request handler for RSC', { status: 500 });
  }

  if (!rscClientManifest) {
    return new Response('Cannot find rsc client manifest', { status: 500 });
  }

  return rscRequestHandler(req, requestHandlerOptions);
};
