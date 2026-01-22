import { time } from '@modern-js/runtime-utils/time';
import type {
  AfterStreamingRenderContext,
  ServerRoute,
  UnstableMiddleware,
  UnstableMiddlewareContext,
} from '@modern-js/types';
import { isArray, isFunction } from '@modern-js/utils';
import type { ServerNodeEnv } from '../../adapters/node/hono';
import { ServerTimings } from '../../constants';
import { getLoaderCtx } from '../../helper';
import type {
  Context,
  Middleware,
  PrepareWebServerFn,
  ServerEnv,
  ServerPluginHooks,
} from '../../types';
import { transformResponse } from '../../utils';
import { type ResArgs, createBaseHookContext } from './base';
import {
  createAfterStreamingRenderContext,
  createCustomMiddlewaresCtx,
  getAfterMatchCtx,
  getAfterRenderCtx,
} from './context';

const noop = () => {};

const isHtmlResponse = (response: Response) => {
  const contentType = response.headers.get('content-type');
  return contentType?.includes('text/html');
};

export class CustomServer {
  private hooks: ServerPluginHooks;

  private serverMiddlewarePromise: ReturnType<PrepareWebServerFn>;

  constructor(hooks: ServerPluginHooks, pwd: string) {
    this.hooks = hooks;

    // The webExtension is deprecated, so we give a empty array to it.
    const webExtension: any[] = [];

    // get api or web server handler from server-framework plugin
    // prepareWebServe must run before server runner.
    this.serverMiddlewarePromise = hooks.prepareWebServer.call({
      pwd,
      config: {
        middleware: webExtension,
      },
    });
  }

  getHookMiddleware(
    entryName: string,
    routes: ServerRoute[],
  ): Middleware<ServerEnv> {
    return async (c, next) => {
      // afterMatchhook
      const routeInfo = routes.find(route => route.entryName === entryName)!;
      const monitors = c.get('monitors');

      // Not provider monitors in hook context, for hook is deprecated in next version
      const baseHookCtx = createBaseHookContext(c);
      const afterMatchCtx = getAfterMatchCtx(entryName, baseHookCtx);

      const getCost = time();
      await this.hooks.afterMatch.call(afterMatchCtx);
      const cost = getCost();

      cost && monitors?.timing(ServerTimings.SERVER_HOOK_AFTER_MATCH, cost);

      const { url, status } = afterMatchCtx.router;

      if (url) {
        return c.redirect(url, status);
      }

      // rewrite to another entry
      const { current } = afterMatchCtx.router;

      if (current !== entryName) {
        const rewriteRoute = routes.find(route => route.entryName === current);
        if (rewriteRoute) {
          c.set('matchPathname', rewriteRoute.urlPath);
          c.set('matchEntryName', current);
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

        c.res = transformResponse(c.res, async (chunk: string) => {
          const context = afterStreamingRenderContext(chunk);
          // TODO: remove string return type
          // Acording to the type definition of ServerPluginLegacy hooks afterStreamingRender,
          // the legacy afterStreamingRender hook return type is string,
          // for backward compatibility, we keep the string return type temporarily
          // and remove it in the next major version
          const result = (await this.hooks.afterStreamingRender.call(
            context,
          )) as unknown as AfterStreamingRenderContext | string;

          if (typeof result === 'string') {
            return result;
          }

          return result.chunk;
        });
      } else {
        // run afterRenderHook hook
        const afterRenderCtx = await getAfterRenderCtx(
          c,
          baseHookCtx,
          routeInfo,
        );

        const getCost = time();
        await this.hooks.afterRender.call(afterRenderCtx);
        const cost = getCost();

        cost && monitors?.timing(ServerTimings.SERVER_HOOK_AFTER_RENDER, cost);

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

    if (
      !serverMiddleware ||
      (!isFunction(serverMiddleware) && !isArray(serverMiddleware))
    ) {
      return;
    }

    // if server middleware is array, concat it with render middleware
    if (Array.isArray(serverMiddleware)) {
      const unstableMiddlewares = getServerMidFromUnstableMid(serverMiddleware);
      return unstableMiddlewares;
    }

    // TODO: This middleware way is depreated in next version
    return async (c, next) => {
      const monitors = c.get('monitors');

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
      cost && monitors?.timing(ServerTimings.SERVER_MIDDLEWARE, cost);

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

export function getServerMidFromUnstableMid(
  serverMiddleware: UnstableMiddleware[],
): Array<Middleware<ServerNodeEnv & ServerEnv>> {
  return serverMiddleware.map(middleware => {
    return async (c, next) => {
      const context = await createMiddlewareContextFromHono(c);

      return middleware(context, next);
    };
  });
}

function isRedirect(headers: Headers, code?: number) {
  return [301, 302, 307, 308].includes(code || 0) || headers.get('Location');
}

// TODO: maybe we need use hono ctx directly
// TODO: after we use hono ctx, we should use `c.get('monitors')` to get monitors
async function createMiddlewareContextFromHono(
  c: Context<ServerNodeEnv & ServerEnv>,
): Promise<UnstableMiddlewareContext> {
  const loaderContext = getLoaderCtx(c as Context);

  const rawRequest = c.req.raw;

  const method = rawRequest.method.toUpperCase();

  if (!['GET', 'HEAD'].includes(method) && !rawRequest.body && c.env.node.req) {
    const { Readable } = await import('stream');

    const body = Readable.toWeb(c.env.node.req);
    const init = {
      body,
      headers: rawRequest.headers,
      signal: rawRequest.signal,
      method: rawRequest.method,
      duplex: 'half' as const,
    } as RequestInit;

    c.req.raw = new Request(rawRequest.url, init);
  }

  return {
    get request() {
      return c.req.raw;
    },

    set request(request: Request) {
      c.req.raw = request;
    },

    get response() {
      return c.res;
    },

    set response(newRes) {
      c.res = newRes;
    },

    get route() {
      return c.get('route');
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
