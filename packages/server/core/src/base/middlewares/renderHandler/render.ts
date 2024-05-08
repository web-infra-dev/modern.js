import type { IncomingMessage } from 'http';
import { Logger, Metrics, Reporter, ServerRoute } from '@modern-js/types';
import { cutNameByHyphen } from '@modern-js/utils/universal';
import type { FallbackReason } from '../../../core/plugin';
import { REPLACE_REG } from '../../../base/constants';
import { Render } from '../../../core/render';
import {
  createErrorHtml,
  sortRoutes,
  parseQuery,
  transformResponse,
  getPathname,
  onError as onErrorFn,
  ErrorDigest,
} from '../../utils';
import { dataHandler } from './dataHandler';
import { SSRRenderOptions, ssrRender } from './ssrRender';

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
  routes: ServerRoute[];
  pwd: string;
  staticGenerate?: boolean;
  onFallback?: OnFallback;
  metaName?: string;
  forceCSR?: boolean;
  nonce?: string;
}

export async function createRender({
  routes,
  pwd,
  metaName,
  staticGenerate,
  forceCSR,
  nonce,
  onFallback: onFallbackFn,
}: CreateRenderOptions): Promise<Render> {
  return async (
    req,
    { logger, nodeReq, reporter, templates, serverManifest, locals, metrics },
  ) => {
    const routeInfo = matchRoute(req, routes);
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
      onErrorFn(logger, ErrorDigest.ERENDER, e as string | Error, req);
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
      reporter,
      serverRoutes: routes,
      locals,
      serverManifest,
      metrics,
    };

    let response: Response | void;

    switch (renderMode) {
      case 'data':
        response = await dataHandler(req, renderOptions);
        if (!response) {
          response = await renderHandler(req, renderOptions, 'ssr', onError);
        }
        break;

      case 'ssr':
      case 'csr':
        response = await renderHandler(req, renderOptions, renderMode, onError);
        break;
      default:
        throw new Error(`Unknown render mode: ${renderMode}`);
    }

    applyExtendHeaders(response, routeInfo);

    return response;
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
      params: {} as Record<string, any>,
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

  return transformResponse(response, injectServerData(serverData));
}

function matchRoute(
  req: Request,
  routes: ServerRoute[],
): ServerRoute | undefined {
  const sorted = routes.sort(sortRoutes);
  for (const route of sorted) {
    const pathname = getPathname(req);

    if (pathname.startsWith(route.urlPath)) {
      return route;
    }
  }

  return undefined;
}

function applyExtendHeaders(r: Response, route: ServerRoute) {
  Object.entries(route.responseHeaders || {}).forEach(([k, v]) => {
    r.headers.set(k, v as string);
  });
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
