import { BaseSSRServerContext } from '@modern-js/types';
import { Logger, LoggerInterface } from './libs/logger';
import { ModernRouteInterface, RouteMatchManager } from './libs/route';
import { metrics as defaultMetrics } from './libs/metrics';

export type Context = Record<string, any>;

export interface HandlerOptions {
  request: Request;
  loadableStats: Record<string, any>;
  routeManifest: Record<string, any>;
}

export class ReturnResponse {
  body: string;

  statusCode: number;

  headers: Headers;

  locals: Record<string, any>;

  constructor(
    body: string,
    status: number,
    locals: Record<string, any>,
    headers: Record<string, any> = {
      'content-type': 'text/html;charset=UTF-8',
    },
  ) {
    this.body = body;
    this.statusCode = status;
    this.locals = locals;
    this.headers = new Headers(headers);
  }

  setHeader(key: string, value: string) {
    this.headers.set(key, value);
  }

  status(code: number) {
    this.statusCode = code;
  }
}

export type Manifest = {
  pages: Record<
    string, // path
    {
      entryName: string;
      template: string;
      serverRender?: (ctx: Record<string, any>) => Promise<string>;
    }
  >;
  routes: ModernRouteInterface[];
};

export const handleUrl = (url: string) => {
  return url.replace(/^https?:\/\/.*?\//gi, '/');
};

const RESPONSE_NOTFOUND = new ReturnResponse('404: Page not found', 404, {});

export const createHandler = (manifest: Manifest) => {
  const routeMgr = new RouteMatchManager();
  const { pages, routes } = manifest;
  routeMgr.reset(routes);
  return async (options: HandlerOptions): Promise<ReturnResponse> => {
    const { request, loadableStats, routeManifest } = options;
    // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/url
    const url = new URL(request.url);
    const pageMatch = routeMgr.match(url.pathname);
    if (!pageMatch) {
      return RESPONSE_NOTFOUND;
    }
    const page = pages[pageMatch.spec.urlPath];
    if (page.serverRender) {
      try {
        const response = new ReturnResponse('', 200, {});
        const params = pageMatch.parseURLParams(url.pathname) || {};

        const serverRenderContext: BaseSSRServerContext = {
          request: createServerRequest(url, request, params),
          response,
          loadableStats,
          routeManifest,
          redirection: {},
          template: page.template,
          entryName: page.entryName,
          logger: new Logger({
            level: 'warn',
          }) as Logger & LoggerInterface,
          metrics: defaultMetrics as any,
          req: request as any,
          res: response as any,
        };

        const body = await page.serverRender(serverRenderContext);
        response.body = body;

        return response;
      } catch (e) {
        return createResponse(page.template);
      }
    }

    return createResponse(page.template);

    function createServerRequest(
      // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/url
      url: URL,
      request: Request,
      params: Record<string, string>,
    ) {
      const { pathname, host, searchParams } = url;
      const { headers: rawHeaders } = request;
      const headers = {} as Record<string, any>;
      rawHeaders.forEach((value, key) => {
        headers[key] = value;
      });
      // eslint-disable-next-line node/no-unsupported-features/es-builtins
      const query = Object.fromEntries(searchParams);

      return {
        pathname,
        host,
        headers,
        params,
        query,
      };
    }
  };
};

function createResponse(template?: string) {
  if (template) {
    return new ReturnResponse(template, 200, {});
  } else {
    return RESPONSE_NOTFOUND;
  }
}
