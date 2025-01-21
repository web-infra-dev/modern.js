import type { IncomingMessage } from 'http';
import type { Logger, Metrics, Reporter, ServerRoute } from '@modern-js/types';
import { cutNameByHyphen } from '@modern-js/utils/universal';
import type { Router } from 'hono/router';
import { TrieRouter } from 'hono/router/trie-router';
import { REPLACE_REG, X_MODERNJS_RENDER } from '../../constants';
import type {
  CacheConfig,
  FallbackReason,
  OnFallback,
  UserConfig,
} from '../../types';
import type { Render } from '../../types';
import type { Params } from '../../types/requestHandler';
import { uniqueKeyByRoute } from '../../utils';
import {
  ErrorDigest,
  createErrorHtml,
  getPathname,
  getRuntimeEnv,
  onError as onErrorFn,
  parseHeaders,
  parseQuery,
  sortRoutes,
  transformResponse,
} from '../../utils';
import { dataHandler } from './dataHandler';
import { renderRscHandler } from './renderRscHandler';
import { serverActionHandler } from './serverActionHandler';
import { type SSRRenderOptions, ssrRender } from './ssrRender';

interface CreateRenderOptions {
  pwd: string;
  routes: ServerRoute[];
  config: UserConfig;
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

type MatchedRoute = [ServerRoute, Params];
function matchRoute(
  router: Router<ServerRoute>,
  pathname: string,
  entryName?: string,
): MatchedRoute {
  const matched = router.match('*', pathname);
  // For route rewrite in server.ts
  // If entryName is existed and the pathname matched multiple routes, we use entryName to find the target route
  if (entryName && matched[0].length > 1) {
    const matches: Array<MatchedRoute> = matched[0];
    const result = matches.find(
      ([route]) => route.entryName === entryName,
    ) as MatchedRoute;
    return result || [];
  } else {
    const result = matched[0][0];
    return result || [];
  }
}

function getHeadersWithoutCookie(headers: Record<string, any>) {
  const _headers = {
    ...headers,
    cookie: undefined,
  };
  delete _headers.cookie;

  return _headers;
}

export async function createRender({
  routes,
  pwd,
  metaName,
  staticGenerate,
  cacheConfig,
  forceCSR,
  config,
  onFallback: onFallbackFn,
}: CreateRenderOptions): Promise<Render> {
  const router = getRouter(routes);

  return async (
    req,
    {
      logger,
      reporter,
      metrics,
      monitors,
      nodeReq,
      templates,
      serverManifest,
      rscClientManifest,
      rscSSRManifest,
      rscServerManifest,
      locals,
      matchEntryName,
      matchPathname,
      loaderContext,
    },
  ) => {
    const forMatchpathname = matchPathname ?? getPathname(req);
    const [routeInfo, params] = matchRoute(
      router,
      forMatchpathname,
      matchEntryName,
    );
    const framework = metaName || 'modern-js';
    const fallbackHeader = `x-${cutNameByHyphen(framework)}-ssr-fallback`;
    let fallbackReason = null;

    const onFallback = async (reason: FallbackReason, error?: unknown) => {
      fallbackReason = reason;
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

    const html = templates[uniqueKeyByRoute(routeInfo)];
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
      fallbackHeader,
      routeInfo.isSSR,
      forceCSR,
      nodeReq,
      onFallback,
    );

    const headerData = parseHeaders(req);

    const onError = (e: unknown) => {
      monitors?.error(
        `SSR Error - ${
          e instanceof Error ? e.name : e
        }, error = %s, req.url = %s, req.headers = %o`,
        e instanceof Error ? e.stack || e.message : e,
        forMatchpathname,
        getHeadersWithoutCookie(headerData),
      );
    };

    const onTiming = (name: string, dur: number) => {
      monitors?.timing(name, dur, 'SSR');
    };

    const onBoundError = async (e: unknown) => {
      onErrorFn(ErrorDigest.ERENDER, e as string | Error, monitors, req);
      await onFallback?.('error', e);
    };

    const renderOptions: SSRRenderOptions & {
      serverRoutes: ServerRoute[];
    } = {
      pwd,
      html,
      routeInfo,
      staticGenerate: staticGenerate || false,
      config,
      nodeReq,
      cacheConfig,
      reporter,
      serverRoutes: routes,
      params,
      logger,
      metrics,
      locals,
      rscClientManifest,
      rscSSRManifest,
      rscServerManifest,
      serverManifest,
      loaderContext: loaderContext || new Map(),
      onError,
      onTiming,
    };

    let response: Response;

    switch (renderMode) {
      case 'data':
        response =
          (await dataHandler(req, renderOptions)) ||
          (await renderHandler(req, renderOptions, 'ssr', onBoundError));
        break;
      case 'rsc-tree':
        response = await renderRscHandler(req, renderOptions);
        break;
      case 'rsc-action':
        response = await serverActionHandler(req, renderOptions);
        break;
      case 'ssr':
      case 'csr':
        response = await renderHandler(
          req,
          renderOptions,
          renderMode,
          onBoundError,
        );
        break;
      default:
        throw new Error(`Unknown render mode: ${renderMode}`);
    }
    // inject ssr fallback header info
    if (fallbackReason) {
      response.headers.set(fallbackHeader, `1;reason=${fallbackReason}`);
    }
    return response;
  };
}

async function renderHandler(
  request: Request,
  options: SSRRenderOptions,
  mode: 'ssr' | 'csr',
  onError: (e: unknown) => Promise<void>,
) {
  let response: Response | null = null;

  const { serverManifest } = options;

  const ssrByRouteIds = options.config.server?.ssrByRouteIds;
  const runtimeEnv = getRuntimeEnv();

  if (
    serverManifest.nestedRoutesJson &&
    ssrByRouteIds &&
    ssrByRouteIds?.length > 0 &&
    runtimeEnv === 'node'
  ) {
    const { nestedRoutesJson } = serverManifest;
    const routes = nestedRoutesJson?.[options.routeInfo.entryName!];

    if (routes) {
      const urlPath = 'node:url';
      const { pathToFileURL } = await import(urlPath);
      const { matchRoutes } = await import(
        pathToFileURL(require.resolve('@modern-js/runtime-utils/remix-router'))
          .href
      );

      const url = new URL(request.url);
      const matchedRoutes = matchRoutes(
        routes,
        url.pathname,
        options.routeInfo.urlPath,
      );

      if (!matchedRoutes) {
        response = csrRender(options.html);
      } else {
        const lastMatch = matchedRoutes[matchedRoutes.length - 1];
        if (
          !lastMatch?.route?.id ||
          !ssrByRouteIds.includes(lastMatch.route.id)
        ) {
          response = csrRender(options.html);
        }
      }
    }
  }

  if (mode === 'ssr' && !response) {
    try {
      response = await ssrRender(request, options);
    } catch (e) {
      await onError(e);
      response = csrRender(options.html);
    }
  } else {
    response = csrRender(options.html);
  }

  const { routeInfo } = options;
  applyExtendHeaders(response, routeInfo);

  return response;

  function applyExtendHeaders(r: Response, route: ServerRoute) {
    Object.entries(route.responseHeaders || {}).forEach(([k, v]) => {
      r.headers.set(k, v as string);
    });
  }
}

async function getRenderMode(
  req: Request,
  fallbackHeader: string,
  isSSR?: boolean,
  forceCSR?: boolean,
  nodeReq?: IncomingMessage,
  onFallback?: (reason: FallbackReason, err?: unknown) => Promise<void>,
): Promise<'ssr' | 'csr' | 'data' | 'rsc-action' | 'rsc-tree'> {
  const query = parseQuery(req);
  if (req.headers.get('x-rsc-action')) {
    return 'rsc-action';
  }

  if (req.headers.get('x-rsc-tree')) {
    return 'rsc-tree';
  }

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
