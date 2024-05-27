import {
  ServerRoute,
  UnstableMiddlewareContext,
  UnstableMiddleware,
} from '@modern-js/types';
import { time } from '@modern-js/runtime-utils/time';
import { ServerBase } from '../../serverBase';
import { ServerHookRunner } from '../../../core/plugin';
import { Context, Middleware, ServerEnv } from '../../../core/server';
import { transformResponse } from '../../utils';
import { ServerReportTimings } from '../../constants';
import type { ServerNodeEnv } from '../../adapters/node/hono';
import { getLoaderCtx } from './loader';
import {
  getAfterMatchCtx,
  getAfterRenderCtx,
  createCustomMiddlewaresCtx,
  createAfterStreamingRenderContext,
} from './context';
import { ResArgs, createBaseHookContext } from './base';

export { getLoaderCtx } from './loader';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const isHtmlResponse = (response: Response) => {
  const contentType = response.headers.get('content-type');
  return contentType?.includes('text/html');
};

export class CustomServer {
  private runner: ServerHookRunner;

  private serverMiddlewarePromise: ReturnType<
    ServerHookRunner['prepareWebServer']
  >;

  private serverBase: ServerBase;

  constructor(runner: ServerHookRunner, serverBase: ServerBase, pwd: string) {
    this.runner = runner;

    this.serverBase = serverBase;

    // The webExtension is deprecated, so we give a empty array to it.
    const webExtension: any[] = [];

    // get api or web server handler from server-framework plugin
    // prepareWebServe must run before server runner.
    this.serverMiddlewarePromise = runner.prepareWebServer(
      {
        pwd,
        config: {
          middleware: webExtension,
        },
      },
      { onLast: () => [] },
    );
  }

  getHookMiddleware(
    entryName: string,
    routes: ServerRoute[],
  ): Middleware<ServerEnv> {
    // eslint-disable-next-line consistent-return
    return async (c, next) => {
      // afterMatchhook
      const routeInfo = routes.find(route => route.entryName === entryName)!;
      const reporter = c.get('reporter');

      const baseHookCtx = createBaseHookContext(c);
      const afterMatchCtx = getAfterMatchCtx(entryName, baseHookCtx);

      const getCost = time();
      await this.runner.afterMatch(afterMatchCtx, { onLast: noop });
      const cost = getCost();
      cost &&
        reporter?.reportTiming(
          ServerReportTimings.SERVER_HOOK_AFTER_MATCH,
          cost,
        );

      const { url, status } = afterMatchCtx.router;

      if (url) {
        return c.redirect(url, status);
      }

      // rewrite to another entry
      const { current } = afterMatchCtx.router;

      if (current !== entryName) {
        const rewriteRoute = routes.find(route => route.entryName === current);
        if (rewriteRoute) {
          return this.serverBase.request(rewriteRoute.urlPath);
        }
      }

      // TODO: reduce the number of calls
      if (c.finalized) {
        return undefined;
      }

      await next();

      if (
        c.finalized &&
        (!c.res.body ||
          !isHtmlResponse(c.res) ||
          [404, 500].includes(c.res.status))
      ) {
        // We shouldn't handle response.body, if response body == null
        return undefined;
      }

      // TODO: fix by hono
      // c.res must sync with c.#status
      // but hono not do it,
      // so we sync it manually
      if (c.res) {
        c.status(c.res.status);
      }

      if (routeInfo.isStream) {
        // run afterStreamingRender hook
        const afterStreamingRenderContext = createAfterStreamingRenderContext(
          baseHookCtx,
          routeInfo,
        );

        c.res = transformResponse(c.res, (chunk: string) => {
          const context = afterStreamingRenderContext(chunk);
          return this.runner.afterStreamingRender(context, {
            onLast: ({ chunk }) => chunk,
          });
        });
      } else {
        // run afterRenderHook hook
        const afterRenderCtx = await getAfterRenderCtx(
          c,
          baseHookCtx,
          routeInfo,
        );

        const getCost = time();
        await this.runner.afterRender(afterRenderCtx, { onLast: noop });
        const cost = getCost();
        cost &&
          reporter?.reportTiming(
            ServerReportTimings.SERVER_HOOK_AFTER_RENDER,
            cost,
          );

        if ((afterRenderCtx.response as any).private_overrided) {
          return undefined;
        }

        const newBody = afterRenderCtx.template.get();

        c.res = c.body(newBody);
      }
    };
  }

  async getServerMiddleware(): Promise<
    | Middleware<ServerNodeEnv & ServerEnv>
    | Array<Middleware<ServerNodeEnv & ServerEnv>>
    | undefined
  > {
    const serverMiddleware = await this.serverMiddlewarePromise;

    if (!serverMiddleware) {
      return;
    }

    if (Array.isArray(serverMiddleware)) {
      // eslint-disable-next-line consistent-return
      return getUnstableMiddlewares(serverMiddleware);
    }

    // eslint-disable-next-line consistent-return
    return async (c, next) => {
      const reporter = c.get('reporter');

      const locals: Record<string, any> = {};

      const resArgs: ResArgs = {
        headers: new Headers(),
      };

      const customMiddlewareCtx = createCustomMiddlewaresCtx(
        c,
        locals,
        resArgs,
      );

      const getCost = time();
      await serverMiddleware(customMiddlewareCtx);
      const cost = getCost();
      cost &&
        reporter?.reportTiming(ServerReportTimings.SERVER_MIDDLEWARE, cost);

      c.set('locals', locals);

      if (isRedirect(resArgs.headers, resArgs.status)) {
        return c.redirect(
          resArgs.headers.get('Location') || '',
          resArgs.status || 302,
        );
      }

      if (c.env?.node?.res?.headersSent) {
        return undefined;
      }

      if (!c.finalized) {
        return next();
      }
    };
  }
}

function isRedirect(headers: Headers, code?: number) {
  return [301, 302, 307, 308].includes(code || 0) || headers.get('Location');
}

function getUnstableMiddlewares(
  serverMiddleware: UnstableMiddleware[],
): Array<Middleware<ServerNodeEnv & ServerEnv>> {
  return serverMiddleware.map(middleware => {
    return async (c, next) => {
      const context = createMiddlewareContextFromHono(c);

      return middleware(context, next);
    };
  });
}

function createMiddlewareContextFromHono(
  c: Context,
): UnstableMiddlewareContext {
  const loaderContext = getLoaderCtx(c);

  return {
    get request() {
      return c.req.raw;
    },

    get response() {
      return c.res;
    },

    set response(newRes) {
      c.res = newRes;
    },

    get(key) {
      return loaderContext.get(key as string);
    },

    set(key, value) {
      return loaderContext.set(key as string, value);
    },

    status: c.status.bind(c),

    header: c.header.bind(c),

    body: c.body.bind(c),

    html: c.html.bind(c),

    redirect: c.redirect.bind(c),
  };
}
