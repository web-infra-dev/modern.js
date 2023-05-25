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

  status: number;

  headers: Headers;

  constructor(body: string, status: number, headers: Record<string, any> = {}) {
    this.body = body;
    this.status = status;
    this.headers = new Headers(headers);
    this.headers.set('content-type', 'text/html;charset=UTF-8');
  }

  /**
   * Iterate a Object
   * 1. adds the value if the key does not already exist.
   * 2. append the value if the key does already exist.
   *
   * more detail follow: https://developer.mozilla.org/en-US/docs/Web/API/Headers/append
   * @param headers
   * @returns
   */
  appendHeaders(headers: Record<string, any>): this {
    Object.entries(headers).forEach(([key, value]) => {
      this.headers.append(key, value.toString() as string);
    });

    return this;
  }

  /**
   * Iterate a Object
   * 1. adds the value if the key does not already exist.
   * 2. modify the value if the key does already exist.
   *
   * more detail follow: https://developer.mozilla.org/en-US/docs/Web/API/Headers/set
   * @param headers
   * @returns
   */
  setHeaders(headers: Record<string, any>): this {
    Object.entries(headers).forEach(([key, value]) => {
      this.headers.set(key, value.toString() as string);
    });

    return this;
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

const RESPONSE_NOTFOUND = new ReturnResponse('404: Page not found', 404);

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
        const responseLike = {
          headers: {} as Record<string, any>,
          statusCode: 200,
          locals: {} as Record<string, any>,
          setHeader(key: string, value: string) {
            this.headers[key] = value;
          },
          status(code: number) {
            this.statusCode = code;
          },
        };
        const params = pageMatch.parseURLParams(url.pathname) || {};

        const { urlPath: baseUrl } = pageMatch;
        const serverRenderContext: BaseSSRServerContext = {
          request: createServerRequest(url, baseUrl, request, params),
          response: responseLike,
          loadableStats,
          routeManifest,
          redirection: {},
          template: page.template,
          entryName: page.entryName,
          logger: new Logger({
            level: 'warn',
          }) as Logger & LoggerInterface,
          metrics: defaultMetrics as any,
          // FIXME: pass correctly req & res
          req: request as any,
          res: responseLike as any,
        };

        const body = await page.serverRender(serverRenderContext);

        return new ReturnResponse(
          body,
          responseLike.statusCode,
          responseLike.headers,
        );
      } catch (e) {
        console.warn(
          `page(${pageMatch.spec.urlPath}) serverRender occur error: `,
        );
        console.warn(e);

        return createResponse(page.template);
      }
    }

    console.warn(`Can't not page(${pageMatch.spec.urlPath}) serverRender`);

    return createResponse(page.template);

    function createServerRequest(
      // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/url
      url: URL,
      baseUrl: string,
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
        url: url.href,
        baseUrl,
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
    return new ReturnResponse(template, 200);
  } else {
    return RESPONSE_NOTFOUND;
  }
}
