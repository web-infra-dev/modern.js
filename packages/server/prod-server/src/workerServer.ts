import { createAsyncPipeline } from '@modern-js/plugin';
import {
  AfterMatchContext,
  AfterRenderContext,
  MiddlewareContext,
} from '@modern-js/types/server';
import { NextFunction } from '@modern-js/types';
import { Logger, LoggerInterface } from './libs/logger';
import { ModernRouteInterface, RouteMatchManager } from './libs/route';
import {
  WorkerServerContext,
  createAfterMatchContext,
  createAfterRenderContext,
  createMiddlewareContext,
} from './libs/hook-api/index.worker';

import { metrics as defaultMetrics } from './libs/metrics';

const isRedirect = (code: number) => {
  return [301, 302, 307, 308].includes(code);
};

export type Context = Record<string, any>;

export interface UrlQuery {
  [key: string]: string;
}

type Middleware = (
  context: MiddlewareContext,
  next: NextFunction,
) => Promise<void> | void;

type HandlerResponse = {
  body: string;
  status: number;
  headers?: Headers;
};

type CustomServer = {
  middleware?: Middleware | Middleware[];
  afterRender?: (
    ctx: AfterRenderContext,
    next: unknown,
  ) => Promise<void> | void;
  afterMatch?: (ctx: AfterMatchContext, next: unknown) => Promise<void> | void;
};

type Page = {
  customServer?: CustomServer;
  entryName: string;
  template: string;
  serverRender?: (ctx: Record<string, any>) => Promise<string>;
};

export type Manifest = {
  pages: Record<
    string, // path
    Page
  >;
  routes: ModernRouteInterface[];
};

export const handleUrl = (url: string) => {
  return url.replace(/^https?:\/\/.*?\//gi, '/');
};

const middlewarePipeline = createAsyncPipeline<MiddlewareContext, void>();

const checkIsSent = (context: WorkerServerContext) => {
  if (context.res.isSent) {
    return true;
  }

  if (context.res.headers.get('Location') && isRedirect(context.res.status)) {
    return true;
  }

  return false;
};

const createHandlerRes = (context: WorkerServerContext) => ({
  body: context.res.body || 'Unkown body',
  status: context.res.status,
  headers: context.res.headers,
});

export const createHandler = (manifest: Manifest) => {
  const routeMgr = new RouteMatchManager();
  const { pages, routes } = manifest;
  routeMgr.reset(routes);
  return async (ctx: Context): Promise<HandlerResponse> => {
    const pageMatch = routeMgr.match(ctx.url);
    if (!pageMatch) {
      return {
        body: '404: Page not found',
        status: 404,
      };
    }
    const entryName = pageMatch.spec.urlPath;
    const page = pages[entryName];

    const hookContext = createWorkerHookContext(
      ctx.request.url,
      ctx.logger,
      ctx.metrics,
    );
    const afterMatchHookContext = createAfterMatchContext(
      hookContext,
      entryName,
    );

    // apply afterMatch
    page?.customServer?.afterMatch?.(afterMatchHookContext, undefined);
    if (checkIsSent(hookContext)) {
      return createHandlerRes(hookContext);
    }

    ctx.request.query ??= ctx.query;
    ctx.request.pathname ??= ctx.pathname;
    ctx.request.params ??= ctx.params;
    const params = pageMatch.parseURLParams(ctx.url);

    // apply middlewares
    const middlewarsHookContext = createMiddlewareContext(hookContext);
    applyMiddlewares(middlewarsHookContext, page.customServer?.middleware);
    if (checkIsSent(hookContext)) {
      return createHandlerRes(hookContext);
    }

    const [body, status] = await render(page, ctx, params);

    // apply afterRender
    const afterRenderHookContext = createAfterRenderContext(hookContext, body);
    page?.customServer?.afterRender?.(afterRenderHookContext, () => undefined);
    if (checkIsSent(hookContext)) {
      return createHandlerRes(hookContext);
    }

    return {
      body: afterRenderHookContext.template.get(),
      status,
    };
  };
};

function applyMiddlewares(ctx: any, middleware?: Middleware[] | Middleware) {
  if (middleware) {
    // fold as a middleware array
    const middlewares = (() => {
      if (Array.isArray(middleware)) {
        return middleware;
      } else {
        return [middleware];
      }
    })();

    middlewares.forEach(middleware => {
      middlewarePipeline.use(middleware);
    });
    middlewarePipeline.run(ctx, { onLast: () => undefined });
  }
}

async function render(
  page: Page,
  ctx: any,
  params: Record<string, string>,
): Promise<[string, number]> {
  if (page.serverRender) {
    try {
      const renderContext = {
        ...(ctx || {}),
        entryName: page.entryName,
        template: page.template,
        req: ctx.request,
        res: ctx.response,
        params: ctx.params || params || {},
        logger:
          ctx.logger ||
          (new Logger({
            level: 'warn',
          }) as Logger & LoggerInterface),
        metrics: ctx.metrics || defaultMetrics,
      };
      const body = await page.serverRender(renderContext);
      return [body, 200];
    } catch (_) {
      return createBodyFromTemplate();
    }
  }
  return createBodyFromTemplate();

  function createBodyFromTemplate(): [string, number] {
    return page.template ? [page.template, 200] : ['404: Page not found', 404];
  }
}

function createWorkerHookContext(
  url: string,
  logger: any,
  metrics: any,
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
  };
}
