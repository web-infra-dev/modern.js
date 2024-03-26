import { ServerRoute } from '@modern-js/types';
import { time } from '@modern-js/runtime-utils/time';
import { ServerBase } from '../../serverBase';
import { ServerHookRunner } from '../../../core/plugin';
import { Middleware, ServerEnv } from '../../../core/server';
import { transformResponse } from '../../utils';
import { ServerReportTimings } from '../../constants';
import type { ServerNodeEnv } from '../../adapters/node/hono';
import {
  getAfterMatchCtx,
  getAfterRenderCtx,
  createCustomMiddlewaresCtx,
  createAfterStreamingRenderContext,
} from './context';
import { createBaseHookContext } from './base';

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
      { onLast: () => null },
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

      const {
        // current,
        url,
        status,
      } = afterMatchCtx.router;

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

      if (c.finalized && (!c.res.body || !isHtmlResponse(c.res))) {
        // We shouldn't handle response.body, if response body == null
        return undefined;
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

  getServerMiddleware(): Middleware<ServerNodeEnv & ServerEnv> {
    // eslint-disable-next-line consistent-return
    return async (c, next) => {
      const serverMiddleware = await this.serverMiddlewarePromise;
      if (!serverMiddleware) {
        return next();
      }

      const reporter = c.get('reporter');

      const locals: Record<string, any> = {};

      const customMiddlewareCtx = createCustomMiddlewaresCtx(c, locals);

      const getCost = time();
      await serverMiddleware(customMiddlewareCtx);
      const cost = getCost();
      cost &&
        reporter?.reportTiming(ServerReportTimings.SERVER_MIDDLEWARE, cost);

      c.set('locals', locals);

      if (!c.finalized) {
        return next();
      }
    };
  }
}
