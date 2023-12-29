import type {
  AfterMatchContext,
  AfterRenderContext,
  BaseSSRServerContext,
  Logger,
  MiddlewareContext,
  NextFunction,
  Reporter,
} from '@modern-js/types';
import { createAsyncPipeline } from '@modern-js/plugin';
import {
  WorkerServerContext,
  createAfterMatchContext,
  createAfterRenderContext,
  createMiddlewareContext,
} from './libs/hook-api/index.worker';
import { ModernRouteInterface, RouteMatchManager } from './libs/route';
import { metrics as defaultMetrics } from './libs/metrics';
import { defaultReporter } from './libs/reporter';

// TODO: inject logger from worker
const createLogger = (): Logger => ({
  error(message, ...args: any[]) {
    console.error(message, ...args);
  },
  info(message, ...args: any[]) {
    console.error(message, ...args);
  },
  warn(message, ...args: any[]) {
    console.warn(message, ...args);
  },
  debug(message, ...args: any[]) {
    console.debug(message, ...args);
  },
});

const calcFallback = (metaName: string) =>
  `x-${metaName.split(/[-_]/)[0]}-ssr-fallback`;

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

type Middleware = (
  context: MiddlewareContext<'worker'>,
  next: NextFunction,
) => Promise<void> | void;

type ServerHooks = {
  middleware?: Middleware | Middleware[];
  afterRender?: (
    ctx: AfterRenderContext,
    next: unknown,
  ) => Promise<void> | void;
  afterMatch?: (ctx: AfterMatchContext, next: unknown) => Promise<void> | void;
};

type Page = {
  entryName: string;
  template: string;
  serverHooks?: ServerHooks;
  serverRender?: (ctx: Record<string, any>) => Promise<string>;
};

export type Manifest = {
  /**
   * @param key - path
   */
  pages: Record<string, Page>;
  routes: ModernRouteInterface[];
  options?: {
    forceCSR?: boolean;
    metaName?: string;
  };
};

const RESPONSE_NOTFOUND = new ReturnResponse('404: Page not found', 404);
const isRedirect = (code: number) => {
  return [301, 302, 307, 308].includes(code);
};
const checkIsSent = (context: WorkerServerContext) => {
  if (context.res.isSent) {
    return true;
  }

  if (context.res.headers.get('Location') && isRedirect(context.res.status)) {
    return true;
  }

  return false;
};
const middlewarePipeline = createAsyncPipeline<
  MiddlewareContext<'worker'>,
  void
>();

export const createHandler = (manifest: Manifest) => {
  const routeMgr = new RouteMatchManager();
  const { pages, routes, options: manifestOpts } = manifest;
  const { metaName = 'modern-js', forceCSR = false } = manifestOpts || {};
  routeMgr.reset(routes);
  return async (options: HandlerOptions): Promise<ReturnResponse> => {
    const { request, loadableStats, routeManifest } = options;
    // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/url
    const url = new URL(request.url);
    const pageMatch = routeMgr.match(url.pathname);
    if (!pageMatch) {
      return RESPONSE_NOTFOUND;
    }

    const entryName = pageMatch.spec.urlPath;
    const page = pages[entryName];
    if (forceCSR && url.searchParams.get('csr') === '1') {
      return createResponse(page.template);
    }

    const logger = createLogger();
    const metrics = defaultMetrics as any;
    const reporter = defaultReporter;
    const route = pageMatch.generate(url.pathname);

    const hookContext = createWorkerHookContext(
      request.url,
      logger,
      metrics,
      reporter,
    );

    const afterMatchHookContext = createAfterMatchContext(
      hookContext,
      entryName,
    );
    // apply afterMatch
    page?.serverHooks?.afterMatch?.(afterMatchHookContext, () => undefined);
    if (checkIsSent(hookContext)) {
      return new ReturnResponse(
        hookContext.res.body || 'Unkown body',
        hookContext.res.status,
        hookContext.res.headers,
      );
    }

    if (page.serverRender) {
      try {
        // apply middlewares
        const middlewarsHookContext = createMiddlewareContext(hookContext);
        applyMiddlewares(middlewarsHookContext, page.serverHooks?.middleware);
        if (checkIsSent(hookContext)) {
          return new ReturnResponse(
            hookContext.res.body || 'Unkown body',
            hookContext.res.status,
            hookContext.res.headers,
          );
        }
        if (
          forceCSR &&
          middlewarsHookContext.request.headers[calcFallback(metaName)]
        ) {
          return createResponse(page.template);
        }

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
        const serverRenderContext: BaseSSRServerContext<'worker'> = {
          request: createServerRequest(url, baseUrl, request, params),
          response: responseLike,
          loadableStats,
          routeManifest,
          redirection: {},
          template: page.template,
          entryName: page.entryName,
          logger,
          reporter: defaultReporter,
          metrics,
          req: request,
          res: responseLike,
          serverTiming: {
            addServeTiming() {
              // noImpl
              return this;
            },
          },
        };

        const body = await page.serverRender(serverRenderContext);

        // apply afterRender
        const afterRenderHookContext = createAfterRenderContext(
          hookContext,
          route,
          body,
        );
        page.serverHooks?.afterRender?.(
          afterRenderHookContext,
          () => undefined,
        );
        if (checkIsSent(hookContext)) {
          return new ReturnResponse(
            hookContext.res.body || 'Unkown body',
            hookContext.res.status,
            hookContext.res.headers,
          );
        }

        return new ReturnResponse(
          afterRenderHookContext.template.get(),
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

    console.warn(`Can't not page(${entryName}) serverRender`);

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

function createWorkerHookContext(
  url: string,
  logger: any,
  metrics: any,
  reporter: Reporter,
): WorkerServerContext {
  const [res, req] = [
    { headers: new Headers(), body: '', status: 200, isSent: false },
    new Request(url),
  ];

  return {
    res,
    req,
    logger,
    metrics,
    reporter,
  };
}

let appliedMiddlewares = false;

function applyMiddlewares(
  ctx: MiddlewareContext<'worker'>,
  middleware?: Middleware[] | Middleware,
) {
  if (middleware) {
    // fold as a middleware array
    const middlewares = (() => {
      if (Array.isArray(middleware)) {
        return middleware;
      } else {
        return [middleware];
      }
    })();

    if (!appliedMiddlewares) {
      middlewares.forEach(middleware => {
        middlewarePipeline.use(middleware);
      });
      appliedMiddlewares = true;
    }
    middlewarePipeline.run(ctx, { onLast: () => undefined });
  }
}
