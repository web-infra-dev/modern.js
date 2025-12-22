import type { ServerRoute } from '@modern-js/types';
import type { NodeRequest } from '@modern-js/types/server';
import { cutNameByHyphen } from '@modern-js/utils/universal';
import type { Router } from 'hono/router';
import { TrieRouter } from 'hono/router/trie-router';
import { X_MODERNJS_RENDER } from '../../constants';
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
  parseHeaders,
  parseQuery,
  sortRoutes,
} from '../../utils';
import { csrRscRender } from './csrRscRender';
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
  forceCSRMap?: Map<string, boolean>;
  nonce?: string;
}

type FallbackWrapper = (
  reason: FallbackReason,
  err?: unknown,
) => ReturnType<OnFallback>;

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
  forceCSRMap,
  config,
  onFallback,
}: CreateRenderOptions): Promise<Render> {
  const router = getRouter(routes);

  return async (
    req,
    {
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
      contextForceCSR,
      reporter,
      bindings,
    },
  ) => {
    const forMatchpathname = matchPathname ?? getPathname(req);
    const [routeInfo, params] = matchRoute(
      router,
      forMatchpathname,
      matchEntryName,
    );
    const framework = cutNameByHyphen(metaName || 'modern-js');
    const fallbackHeader = `x-${framework}-ssr-fallback`;
    let fallbackReason = null;

    const fallbackWrapper: FallbackWrapper = async (reason, error?) => {
      fallbackReason = reason;
      return onFallback?.(reason, error);
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

    const finalForceCSR = routeInfo.entryName
      ? (forceCSRMap?.get(routeInfo.entryName) ?? forceCSR)
      : forceCSR;

    const renderMode = await getRenderMode(
      req,
      fallbackHeader,
      routeInfo.isSSR,
      finalForceCSR,
      nodeReq,
      fallbackWrapper,
      contextForceCSR,
    );

    const headerData = parseHeaders(req);

    const onError = (e: unknown, key?: string) => {
      monitors?.error(
        `SSR Error - ${
          key || (e instanceof Error ? e.name : e)
        }, error = %s, req.url = %s, req.headers = %o`,
        e instanceof Error ? e.stack || e.message : e,
        forMatchpathname,
        getHeadersWithoutCookie(headerData),
      );
    };

    const onTiming = (name: string, dur: number) => {
      monitors?.timing(name, dur, 'SSR');
    };

    // TODO: named `renderOptions` is not accurate
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
      serverRoutes: routes,
      params,
      monitors,
      locals,
      rscClientManifest,
      rscSSRManifest,
      rscServerManifest,
      serverManifest,
      loaderContext: loaderContext || new Map(),
      onError,
      onTiming,
      reporter,
      bindings,
    };

    if (fallbackReason) {
      renderOptions.html = injectFallbackReasonToHtml({
        html: renderOptions.html,
        reason: fallbackReason,
        framework,
      });
    }

    let response: Response;

    switch (renderMode) {
      case 'data':
        response =
          (await dataHandler(req, renderOptions)) ||
          (await renderHandler(
            req,
            renderOptions,
            'ssr',
            fallbackWrapper,
            framework,
          ));
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
          fallbackWrapper,
          framework,
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
  fallbackWrapper: FallbackWrapper,
  framework: string,
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
      const { matchRoutes } = require('@modern-js/runtime-utils/router');

      const url = new URL(request.url);
      const matchedRoutes = matchRoutes(
        routes,
        url.pathname,
        options.routeInfo.urlPath,
      );

      if (!matchedRoutes) {
        response = await csrRender(request, options);
      } else {
        const lastMatch = matchedRoutes[matchedRoutes.length - 1];
        if (
          !lastMatch?.route?.id ||
          !ssrByRouteIds.includes(lastMatch.route.id)
        ) {
          response = await csrRender(request, options);
        }
      }
    }
  }

  if (mode === 'ssr' && !response) {
    try {
      response = await ssrRender(request, options);
    } catch (e) {
      options.onError(e as Error, ErrorDigest.ERENDER);
      await fallbackWrapper('error', e);

      response = await csrRender(request, {
        ...options,
        html: injectFallbackReasonToHtml({
          html: options.html,
          reason: 'error',
          framework,
        }),
      });
    }
  } else {
    response = await csrRender(request, options);
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
  nodeReq?: NodeRequest,
  onFallback?: FallbackWrapper,
  contextForceCSR?: string,
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
    const fallbackHeaderValue: string | null =
      (req.headers.get(fallbackHeader) as string) ||
      (nodeReq?.headers[fallbackHeader] as string);

    if (forceCSR && (query.csr || fallbackHeaderValue || contextForceCSR)) {
      if (query.csr) {
        await onFallback?.('query');
      } else {
        const reason = fallbackHeaderValue?.split(';')[1]?.split('=')[1];
        await onFallback?.(reason ? `header,${reason}` : 'header');
      }
      return 'csr';
    }
    return 'ssr';
  } else {
    return 'csr';
  }
}

function injectFallbackReasonToHtml({
  html,
  reason,
  framework,
}: {
  html: string;
  reason: FallbackReason;
  framework: string;
}) {
  const tag = `<script id="__${framework}_ssr_fallback_reason__" type="application/json">${JSON.stringify({ reason })}</script>`;
  return html.replace(/<\/head>/, `${tag}</head>`);
}

async function csrRender(
  request: Request,
  options: SSRRenderOptions,
): Promise<Response> {
  const { html, rscClientManifest } = options;
  if (!rscClientManifest || process.env.MODERN_DISABLE_INJECT_RSC_DATA) {
    return new Response(html, {
      status: 200,
      headers: new Headers({
        'content-type': 'text/html; charset=UTF-8',
        [X_MODERNJS_RENDER]: 'client',
      }),
    });
  } else {
    return csrRscRender(request, options);
  }
}
