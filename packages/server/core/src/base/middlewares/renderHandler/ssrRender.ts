import type { IncomingMessage } from 'http';
import type { Logger, Metrics, Reporter, ServerRoute } from '@modern-js/types';
import {
  SERVER_RENDER_FUNCTION_NAME,
  MAIN_ENTRY_NAME,
} from '@modern-js/utils/universal/constants';
import * as isbot from 'isbot';
import {
  getRuntimeEnv,
  parseHeaders,
  parseQuery,
  getHost,
  getPathname,
} from '../../utils';
import {
  SSRServerContext,
  ServerManifest,
  ServerRender,
} from '../../../core/server';
import { X_RENDER_CACHE } from '../../constants';
import type * as streamPolyfills from '../../adapters/node/polyfills/stream';
import type * as ssrCaheModule from './ssrCache';
import { ServerTiming } from './serverTiming';

const defaultReporter: Reporter = {
  init() {
    // noImpl
  },
  reportError() {
    // noImpl
  },
  reportTiming() {
    // noImpl
  },
  reportInfo() {
    // noImpl
  },
  reportWarn() {
    // noImpl
  },
};

export interface SSRRenderOptions {
  pwd: string;
  html: string;
  routeInfo: ServerRoute;
  staticGenerate: boolean;
  metaName: string;
  logger: Logger;
  serverManifest: ServerManifest;

  /** Produce by custom server hook */
  locals?: Record<string, any>;
  reporter?: Reporter;
  metrics?: Metrics;
  nodeReq?: IncomingMessage;
  nonce?: string;
}

export async function ssrRender(
  request: Request,
  {
    routeInfo,
    html,
    staticGenerate,
    nonce,
    metaName,
    reporter,
    logger,
    nodeReq,
    serverManifest,
    locals,
    metrics,
  }: SSRRenderOptions,
): Promise<Response> {
  const { entryName } = routeInfo;
  const loadableStats = serverManifest.loadableStats || {};
  const routeManifest = serverManifest.routeManifest || {};

  const host = getHost(request);
  const isSpider = isbot.default(request.headers.get('user-agent'));
  const responseProxy = new ResponseProxy();

  const query = parseQuery(request);
  const headers = parseHeaders(request);

  if (nodeReq) {
    for (const key in nodeReq.headers) {
      if (!headers[key]) {
        headers[key] = nodeReq.headers[key] as string;
      }
    }
  }

  const ssrContext: SSRServerContext = {
    request: {
      baseUrl: routeInfo.urlPath,
      params: {} as Record<string, string>,
      pathname: nodeReq
        ? getPathnameFromNodeReq(nodeReq)
        : getPathname(request),
      host,
      query,
      url: nodeReq ? getHrefFromNodeReq(nodeReq) : request.url,
      headers,
    },
    response: {
      setHeader(key, value) {
        responseProxy.headers.set(key, value);
      },
      status(code) {
        responseProxy.status = code;
      },
      locals: locals || {},
    },
    redirection: {},

    template: html,
    loadableStats,
    routeManifest, // for streaming ssr
    entryName: entryName!,
    staticGenerate,
    logger,
    metrics,
    serverTiming: new ServerTiming(responseProxy.headers, metaName),
    reporter: reporter || defaultReporter,
    /** @deprecated node req */
    req: nodeReq || (request as any),
    /** @deprecated node res  */
    res: undefined,
    isSpider,
    nonce,
  };

  const renderBundle =
    serverManifest.renderBundles?.[entryName || MAIN_ENTRY_NAME];

  if (!renderBundle) {
    throw new Error(`Can't found renderBundle ${entryName || MAIN_ENTRY_NAME}`);
  }

  const runtimeEnv = getRuntimeEnv();

  let ssrResult: Awaited<ReturnType<ServerRender>>;
  let cacheStatus: ssrCaheModule.CacheStatus | undefined;
  const render: ServerRender = renderBundle[SERVER_RENDER_FUNCTION_NAME];

  if (runtimeEnv === 'node') {
    const cacheModuleName = './ssrCache';
    const { ssrCache } = (await import(
      cacheModuleName
    )) as typeof ssrCaheModule;
    const incomingMessage = nodeReq
      ? nodeReq
      : new IncomingMessgeProxy(request);
    const cacheControl = await ssrCache.matchCacheControl(
      incomingMessage as any,
    );

    if (cacheControl) {
      const { data, status } = await ssrCache.getCache(
        request,
        cacheControl,
        render,
        ssrContext,
      );

      ssrResult = data;
      cacheStatus = status;
    } else {
      ssrResult = await render(ssrContext);
    }
  } else {
    ssrResult = await render(ssrContext);
  }

  const { redirection } = ssrContext;

  // set ssr cacheStatus
  if (cacheStatus) {
    responseProxy.headers.set(X_RENDER_CACHE, cacheStatus);
  }

  if (redirection.url) {
    const { headers } = responseProxy;
    headers.set('Location', redirection.url);
    return new Response(null, {
      status: redirection.status || 302,
      headers: {
        Location: redirection.url,
      },
    });
  }

  const { Readable } = await import('stream').catch(_ => ({
    Readable: undefined,
  }));

  const streamModule = '../../adapters/node/polyfills/stream';
  const { createReadableStreamFromReadable } =
    runtimeEnv === 'node'
      ? ((await import(streamModule).catch(_ => ({
          createReadableStreamFromReadable: undefined,
        }))) as typeof streamPolyfills)
      : { createReadableStreamFromReadable: undefined };

  const data =
    Readable && ssrResult instanceof Readable
      ? createReadableStreamFromReadable?.(ssrResult) || ''
      : (ssrResult as unknown as string | ReadableStream);

  return new Response(data, {
    status: responseProxy.status,
    headers: responseProxy.headers,
  });
}

class ResponseProxy {
  headers: Headers = new Headers();

  status: number = 200;

  constructor() {
    this.headers.set('content-type', 'text/html; charset=UTF-8');
  }
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

function getHrefFromNodeReq(nodeReq: IncomingMessage) {
  function getProtocal() {
    if ((nodeReq.socket as any).encrypted) {
      return 'https';
    }

    const proto = nodeReq.headers['x-forwarded-proto'];
    return proto ? (proto as string).split(/\s*,\s*/, 1)[0] : 'http';
  }

  function getHost() {
    let host = nodeReq.headers['x-forwarded-host'];
    if (!host) {
      // eslint-disable-next-line prefer-destructuring
      host = nodeReq.headers.host;
    }

    host = (host as string).split(/\s*,\s*/, 1)[0] || 'undefined';
    // the host = '',if we can't cat Host or X-Forwarded-Host header
    // but the this.href would assign a invalid value:`http[s]://${pathname}`
    // so we need assign host a no-empty value.
    return host;
  }

  const href = `${getProtocal()}://${getHost()}${nodeReq.url || ''}`;
  return href;
}

export function getPathnameFromNodeReq(nodeReq: IncomingMessage) {
  const { url } = nodeReq;
  if (!url) {
    return '/';
  }
  const match = url.match(/\/[^?]*/);
  let pathname = match ? match[0] : '/';

  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  return pathname;
}
