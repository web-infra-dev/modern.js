import type { IncomingMessage } from 'http';
import type { Logger, Metrics, Reporter, ServerRoute } from '@modern-js/types';
import type {
  Monitors,
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types/server';
import type { NodeRequest } from '@modern-js/types/server';
import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import { X_MODERNJS_RENDER } from '../../constants';
import type { CacheConfig, ServerManifest, UserConfig } from '../../types';
import type {
  OnError,
  OnTiming,
  Params,
  RequestHandlerConfig,
  RequestHandlerOptions,
} from '../../types/requestHandler';
import { getPathname, parseHeaders } from '../../utils';
import { getCacheResult, matchCacheControl, shouldUseCache } from './ssrCache';
import { createRequestHandlerConfig } from './utils';

// TODO: It's a type combine by RenderOptions and CreateRenderOptions, improve it.
export interface SSRRenderOptions {
  pwd: string;
  html: string;
  routeInfo: ServerRoute;
  staticGenerate: boolean;
  config: UserConfig;
  serverManifest: ServerManifest;

  rscServerManifest?: RscServerManifest;
  rscClientManifest?: RscClientManifest;
  rscSSRManifest?: RscSSRManifest;

  loaderContext: Map<string, unknown>;

  params: Params;
  /** Produce by custom server hook */
  locals?: Record<string, any>;
  cacheConfig?: CacheConfig;
  nodeReq?: NodeRequest;

  monitors: Monitors;
  onError: OnError;
  onTiming: OnTiming;
  reporter?: Reporter;

  bindings?: any;
}

const SERVER_RUNTIME_ENTRY = 'requestHandler';

export async function ssrRender(
  request: Request,
  {
    routeInfo,
    html,
    config: userConfig,
    staticGenerate,
    nodeReq,
    serverManifest,
    rscSSRManifest,
    rscClientManifest,
    rscServerManifest,
    locals,
    params,
    loaderContext,
    monitors,
    cacheConfig,
    onError,
    onTiming,
    reporter,
    bindings,
  }: SSRRenderOptions,
): Promise<Response> {
  const { entryName } = routeInfo;
  const loadableStats = serverManifest.loadableStats || {};
  const routeManifest = serverManifest.routeManifest || {};

  const headers = parseHeaders(request);

  if (nodeReq) {
    for (const key in nodeReq.headers) {
      if (!headers[key]) {
        headers[key] = nodeReq.headers[key] as string;
      }
    }
  }

  const renderBundle =
    serverManifest.renderBundles?.[entryName || MAIN_ENTRY_NAME];

  if (!renderBundle) {
    throw new Error(`Can't find renderBundle ${entryName || MAIN_ENTRY_NAME}`);
  }

  const requestHandler = await renderBundle[SERVER_RUNTIME_ENTRY];

  const config = createRequestHandlerConfig(userConfig);

  const requestHandlerOptions: RequestHandlerOptions = {
    resource: {
      route: routeInfo,
      loadableStats,
      routeManifest,
      htmlTemplate: html,
      entryName: entryName || MAIN_ENTRY_NAME,
    },
    params,
    loaderContext,
    config,

    rscSSRManifest,
    rscClientManifest,
    rscServerManifest,

    locals,
    staticGenerate,
    monitors,
    onError,
    onTiming,
    reporter,

    bindings,
  };

  const cacheControl = await matchCacheControl(
    cacheConfig?.strategy,
    nodeReq || (new IncomingMessgeProxy(request) as unknown as NodeRequest),
  );

  let response: Response;

  if (cacheControl && shouldUseCache(request)) {
    response = await getCacheResult(request, {
      cacheControl,
      container: cacheConfig?.container,
      requestHandler: requestHandler!,
      requestHandlerOptions,
    });
  } else {
    response = await requestHandler!(request, requestHandlerOptions);
  }

  response.headers.set(X_MODERNJS_RENDER, 'server');

  response.headers.set('content-type', 'text/html; charset=UTF-8');

  return response;
}

class IncomingMessgeProxy {
  headers: Record<string, string | undefined> = {};

  readonly method: string | undefined;

  readonly url: string | undefined;

  constructor(req: Request) {
    req.headers.forEach((value, key) => {
      this.headers[key] = value;
    });

    this.method = req.method;

    this.url = getPathname(req);
  }
}
