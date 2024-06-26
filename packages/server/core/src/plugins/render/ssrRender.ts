import type { IncomingMessage } from 'http';
import type { Reporter, ServerRoute } from '@modern-js/types';
import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import {
  OnError,
  OnTiming,
  Params,
  RequestHandlerConfig,
  RequestHandlerOptions,
} from '../../types/requestHandler';
import { parseHeaders, getPathname } from '../../utils';
import { CacheConfig, ServerManifest, UserConfig } from '../../types';
import { X_MODERNJS_RENDER } from '../../constants';
import { matchCacheControl, getCacheResult } from './ssrCache';

export interface SSRRenderOptions {
  pwd: string;
  html: string;
  routeInfo: ServerRoute;
  staticGenerate: boolean;
  config: UserConfig;
  serverManifest: ServerManifest;
  loaderContext: Map<string, unknown>;

  params: Params;
  reporter?: Reporter;
  /** Produce by custom server hook */
  locals?: Record<string, any>;
  cacheConfig?: CacheConfig;
  nodeReq?: IncomingMessage;
  // nonce?: string;

  onError?: OnError;
  onTiming?: OnTiming;
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
    locals,
    params,
    loaderContext,
    cacheConfig,
    onError,
    onTiming,
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
    throw new Error(`Can't found renderBundle ${entryName || MAIN_ENTRY_NAME}`);
  }

  const requestHandler = await renderBundle[SERVER_RUNTIME_ENTRY];

  loaderContext.set('privdate_locals', locals);

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

    staticGenerate,
    onError,
    onTiming,
  };

  const cacheControl = await matchCacheControl(
    cacheConfig?.strategy,
    nodeReq || (new IncomingMessgeProxy(request) as IncomingMessage),
  );

  let response: Response;

  if (cacheControl) {
    response = await getCacheResult(request, {
      cacheControl,
      container: cacheConfig?.container,
      requestHandler,
      requestHandlerOptions,
    });
  } else {
    response = await requestHandler(request, requestHandlerOptions);
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

function createRequestHandlerConfig(
  userConfig: UserConfig,
): RequestHandlerConfig {
  const { output, server, security, html } = userConfig;

  return {
    ssr: server?.ssr,
    ssrByEntries: server?.ssrByEntries,
    nonce: security?.nonce,
    enableInlineScripts: output?.enableInlineScripts,
    enableInlineStyles: output?.enableInlineStyles,
    crossorigin: html?.crossorigin,
    scriptLoading: html?.scriptLoading,
  };
}
