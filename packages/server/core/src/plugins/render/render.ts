import type { IncomingMessage } from 'http';
import { Logger, Metrics, Reporter, ServerRoute } from '@modern-js/types';
import { cutNameByHyphen } from '@modern-js/utils/universal';
import { TrieRouter } from 'hono/router/trie-router';
import type { Router } from 'hono/router';
import {
  parseQuery,
  getPathname,
  createErrorHtml,
  sortRoutes,
  transformResponse,
  onError as onErrorFn,
  ErrorDigest,
} from '../../utils';
import type { CacheConfig, FallbackReason } from '../../types';
import { REPLACE_REG, X_MODERNJS_RENDER } from '../../constants';
import { Render } from '../../types';
import { dataHandler } from './dataHandler';
import { Params, SSRRenderOptions, ssrRender } from './ssrRender';

export type OnFallback = (
  reason: FallbackReason,
  utils: {
    logger: Logger;
    metrics?: Metrics;
    reporter?: Reporter;
  },
  error?: unknown,
) => Promise<void>;

interface CreateRenderOptions {
  pwd: string;
  routes: ServerRoute[];
  cacheConfig?: CacheConfig;
  staticGenerate?: boolean;
  onFallback?: OnFallback;
  metaName?: string;
  forceCSR?: boolean;
  nonce?: string;
}

const DYNAMIC_ROUTE_REG = /\/:./;

function getRouter(routes: ServerRoute[]): Router<ServerRoute> {
  const dynamicRoutes: ServerRoute[] = [];
  const normalRoutes: ServerRoute[] = [];

  routes.forEach(route => {
    if (DYNAMIC_ROUTE_REG.test(route.urlPath)) {
      dynamicRoutes.push(route);
    } else {
      normalRoutes.push(route);
    }
  });

  const finalRoutes = [
    ...normalRoutes.sort(sortRoutes),
    ...dynamicRoutes.sort(sortRoutes),
  ];

  const router = new TrieRouter<ServerRoute>();

  for (const route of finalRoutes) {
    const { urlPath: originUrlPath } = route;

    const urlPath = originUrlPath.endsWith('/')
      ? `${originUrlPath}*`
      : `${originUrlPath}/*`;
    router.add('*', urlPath, route);
  }

  return router;
}

function matchRoute(
  router: Router<ServerRoute>,
  request: Request,
): [ServerRoute, Params] {
  const pathname = getPathname(request);
  const matched = router.match('*', pathname);

  const result = matched[0][0];

  return result || [];
}

export async function createRender({
  routes,
  pwd,
  metaName,
  staticGenerate,
  cacheConfig,
  forceCSR,
  nonce,
  onFallback: onFallbackFn,
}: CreateRenderOptions): Promise<Render> {
  const router = getRouter(routes);

  return async (
    req,
    {
      logger,
      nodeReq,
      reporter,
      templates,
      serverManifest,
      locals,
      metrics,
      loaderContext,
    },
  ) => {
    const [routeInfo, params] = matchRoute(router, req);

    const onFallback = async (reason: FallbackReason, error?: unknown) => {
      return onFallbackFn?.(reason, { logger, reporter, metrics }, error);
    };

    if (!routeInfo) {
      return new Response(createErrorHtml(404), {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
        },
      });
    }

    const html = templates[routeInfo.entryName!];

    if (!html) {
      return new Response(createErrorHtml(404), {
        status: 404,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
        },
      });
    }

    const renderMode = await getRenderMode(
      req,
      metaName || 'modern-js',
      routeInfo.isSSR,
      forceCSR,
      nodeReq,
      onFallback,
    );

    const onError = async (e: unknown) => {
      onErrorFn(ErrorDigest.ERENDER, e as string | Error, logger, req);
      await onFallback?.('error', e);
    };

    const renderOptions = {
      pwd,
      html,
      routeInfo,
      staticGenerate: staticGenerate || false,
      metaName: metaName || 'modern-js',
      nonce,
      logger,
      nodeReq,
      cacheConfig,
      reporter,
      serverRoutes: routes,
      params,
      locals,
      serverManifest,
      metrics,
      loaderContext: loaderContext || new Map(),
    };

    switch (renderMode) {
      case 'data':
        // eslint-disable-next-line no-case-declarations
        let response = await dataHandler(req, renderOptions);
        if (!response) {
          response = await renderHandler(req, renderOptions, 'ssr', onError);
        }
        return response;
      case 'ssr':
      case 'csr':
        return renderHandler(req, renderOptions, renderMode, onError);
      default:
        throw new Error(`Unknown render mode: ${renderMode}`);
    }
  };
}

async function renderHandler(
  request: Request,
  options: SSRRenderOptions,
  mode: 'ssr' | 'csr',
  onError: (e: unknown) => Promise<void>,
) {
  // inject server.baseUrl message
  const serverData = {
    router: {
      baseUrl: options.routeInfo.urlPath,
      params: options.params,
    },
  };

  let response: Response;

  if (mode === 'ssr') {
    try {
      response = await ssrRender(request, options);
    } catch (e) {
      await onError(e);
      response = csrRender(options.html);
    }
  } else {
    response = csrRender(options.html);
  }

  const newRes = transformResponse(response, injectServerData(serverData));

  const { routeInfo } = options;
  applyExtendHeaders(newRes, routeInfo);

  return newRes;

  function applyExtendHeaders(r: Response, route: ServerRoute) {
    Object.entries(route.responseHeaders || {}).forEach(([k, v]) => {
      r.headers.set(k, v as string);
    });
  }
}

async function getRenderMode(
  req: Request,
  framework: string,
  isSSR?: boolean,
  forceCSR?: boolean,
  nodeReq?: IncomingMessage,
  onFallback?: (reason: FallbackReason, err?: unknown) => Promise<void>,
): Promise<'ssr' | 'csr' | 'data'> {
  const query = parseQuery(req);

  const fallbackHeader = `x-${cutNameByHyphen(framework)}-ssr-fallback`;

  if (isSSR) {
    if (query.__loader) {
      return 'data';
    }
    if (
      forceCSR &&
      (query.csr ||
        req.headers.get(fallbackHeader) ||
        nodeReq?.headers[fallbackHeader])
    ) {
      if (query.csr) {
        await onFallback?.('query');
      } else {
        await onFallback?.('header');
      }
      return 'csr';
    }
    return 'ssr';
  } else {
    return 'csr';
  }
}

function csrRender(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: new Headers({
      'content-type': 'text/html; charset=UTF-8',
      [X_MODERNJS_RENDER]: 'client',
    }),
  });
}

function injectServerData(serverData: Record<string, any>) {
  const { head } = REPLACE_REG.before;
  const searchValue = new RegExp(head);

  const replcaeCb = (beforeHead: string) =>
    `${beforeHead}<script type="application/json" id="__MODERN_SERVER_DATA__">${JSON.stringify(
      serverData,
    )}</script>`;

  return (template: string) => template.replace(searchValue, replcaeCb);
}
