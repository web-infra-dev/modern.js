import path from 'path';
import { Readable } from 'stream';
import type { IncomingMessage } from 'http';
import type { Logger, Reporter, ServerRoute } from '@modern-js/types';
import {
  LOADABLE_STATS_FILE,
  ROUTE_MANIFEST_FILE,
  SERVER_RENDER_FUNCTION_NAME,
} from '@modern-js/utils';
import * as isbot from 'isbot';
import { createTransformStream } from '../../libs/utils';
import { SSRServerContext, ServerRender } from '../../../core/server';
import { REPLACE_REG } from '../../libs/constants';
import { parseHeaders, parseQuery, getHost } from '../../libs/request';
import { createReadableStreamFromReadable } from '../../adapters/node/polyfills/stream';
import { ServerTiming } from './serverTiming';
import { ssrCache } from './ssrCache';

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

interface SSRRenderOptions {
  pwd: string;
  mode: 'string' | 'stream';
  html: string;
  routeInfo: ServerRoute;
  staticGenerate: boolean;
  metaName: string;
  logger: Logger;
  reporter?: Reporter;
  nodeReq?: IncomingMessage;
  nonce?: string;
}

export async function ssrRender(
  request: Request,
  {
    routeInfo,
    pwd,
    html,
    staticGenerate,
    nonce,
    metaName,
    reporter,
    logger,
    nodeReq,
  }: SSRRenderOptions,
): Promise<Response> {
  const { entryName } = routeInfo;
  const jsBundlePath = path.join(pwd, routeInfo.bundle!);
  const loadableUri = path.join(pwd, LOADABLE_STATS_FILE);

  let loadableStats = {};
  try {
    loadableStats = await import(loadableUri);
  } catch (_) {
    // ignore error
  }

  const routesManifestUri = path.join(pwd, ROUTE_MANIFEST_FILE);
  let routeManifest;

  try {
    routeManifest = await import(routesManifestUri);
  } catch (_) {
    // ignore error
  }

  const host = getHost(request);
  const isSpider = isbot.default(request.headers.get('user-agent'));
  const responseProxy = new ResponseProxy();

  const query = parseQuery(request);
  const headers = parseHeaders(request);

  const ssrContext: SSRServerContext = {
    request: {
      baseUrl: routeInfo.urlPath,
      // TODO: pasre params
      params: {} as Record<string, string>,
      // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/url
      pathname: new URL(request.url).pathname,
      host,
      query,
      url: request.url,
      headers,
    },
    response: {
      setHeader(key, value) {
        responseProxy.headers.set(key, value);
      },
      status(code) {
        responseProxy.status = code;
      },
    },
    redirection: {},
    template: html,
    loadableStats,
    routeManifest, // for streaming ssr
    entryName: entryName!,
    staticGenerate,
    logger,
    serverTiming: new ServerTiming(responseProxy.headers, metaName),
    reporter: reporter || defaultReporter,
    /** @deprecated node req */
    req: undefined,
    /** @deprecated node res  */
    res: undefined,
    isSpider,
    nonce,
  };

  const jsBundle = await import(jsBundlePath);

  const incomingMessage = nodeReq ? nodeReq : new IncomingMessgeProxy(request);
  const cacheControl = await ssrCache.matchCacheControl(incomingMessage as any);

  let ssrResult: Awaited<ReturnType<ServerRender>>;
  const render: ServerRender = jsBundle[SERVER_RENDER_FUNCTION_NAME];
  if (cacheControl) {
    ssrResult = await ssrCache.getCache(
      request,
      cacheControl,
      render,
      ssrContext,
    );
  } else {
    ssrResult = await render(ssrContext);
  }

  const { redirection } = ssrContext;

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

  const serverData = {
    router: {
      baseUrl: routeInfo.urlPath,
      // TODO: parse
      params: {} as Record<string, any>,
    },
  };
  const data =
    ssrResult instanceof Readable
      ? createReadableStreamFromReadable(ssrResult)
      : ssrResult;

  const body = injectServerData(data, serverData);

  return new Response(body, {
    status: responseProxy.status,
    headers: responseProxy.headers,
  });
}

function injectServerData(
  data: string | ReadableStream,
  serverData: Record<string, any>,
): ReadableStream | string {
  const { head } = REPLACE_REG.before;
  const searchValue = new RegExp(head);

  const replcaeCb = (beforeHead: string) =>
    `${beforeHead}<script type="application/json" id="__MODERN_SERVER_DATA__">${JSON.stringify(
      serverData,
    )}</script>`;

  if (typeof data === 'string') {
    return data.replace(searchValue, replcaeCb);
  } else {
    const stream = createTransformStream(before => {
      return before.replace(searchValue, replcaeCb);
    });

    data.pipeThrough(stream);

    return stream.readable;
  }
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

    // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/url
    this.url = new URL(req.url).pathname;
  }
}
