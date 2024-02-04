import { ServerRoute } from '@modern-js/types';
import { ServerHookRunner } from '@core/plugin';
import { Metrics, Middleware, HonoNodeEnv } from '../types';
import {
  createAfterMatchCtx,
  createAfterRenderCtx,
  createCustomMiddlewaresCtx,
  createAfterStreamingRenderContext,
} from '../libs/customServer';
import { createTransformStream } from '../libs/utils';
import { ServerBase } from '../serverBase';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export class CustomServer {
  private runner: ServerHookRunner;

  private metrics?: Metrics;

  private serverMiddlewarePromise: ReturnType<
    ServerHookRunner['prepareWebServer']
  >;

  private serverBase: ServerBase;

  constructor(
    runner: ServerHookRunner,
    serverBase: ServerBase,
    pwd: string,
    metrics?: Metrics,
  ) {
    this.runner = runner;

    this.serverBase = serverBase;

    this.metrics = metrics;

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
  ): Middleware<HonoNodeEnv> {
    // eslint-disable-next-line consistent-return
    return async (c, next) => {
      // afterMatchhook
      const routeInfo = routes.find(route => route.entryName === entryName)!;
      const logger = c.get('logger');
      const afterMatchCtx = createAfterMatchCtx(
        c,
        entryName,
        logger,
        this.metrics,
      );

      // TODO: reportTiming
      await this.runner.afterMatch(afterMatchCtx, { onLast: noop });

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
        // eslint-disable-next-line consistent-return
        return;
      }

      await next();

      if (c.finalized) {
        // eslint-disable-next-line consistent-return
        return;
      }

      if (routeInfo.isStream) {
        // run afterStreamingRender hook
        const afterStreamingRenderContext = createAfterStreamingRenderContext(
          c,
          logger,
          routeInfo,
          this.metrics,
        );

        const injectStream = createTransformStream((chunk: string) => {
          const context = afterStreamingRenderContext(chunk);
          return this.runner.afterStreamingRender(context, {
            onLast: ({ chunk }) => chunk,
          });
        });

        c.res.body?.pipeThrough(injectStream);

        const { headers, status, statusText } = c.res;
        c.res = c.body(injectStream.readable, {
          headers,
          status,
          statusText,
        });
      } else {
        // run afterRenderHook hook
        const afterRenderCtx = await createAfterRenderCtx(
          c,
          logger,
          this.metrics,
        );

        // TODO: repoteTiming
        await this.runner.afterRender(afterRenderCtx, { onLast: noop });

        if ((afterRenderCtx.response as any).private_overrided) {
          // eslint-disable-next-line consistent-return
          return;
        }

        const newBody = afterRenderCtx.template.get();

        c.res = c.body(newBody);
      }
    };
  }

  getServerMiddleware(): Middleware<HonoNodeEnv> {
    // eslint-disable-next-line consistent-return
    return async (c, next) => {
      const serverMiddleware = await this.serverMiddlewarePromise;
      if (!serverMiddleware) {
        return next();
      }

      const logger = c.get('logger');

      const customMiddlewareCtx = createCustomMiddlewaresCtx(
        c,
        logger,
        this.metrics,
      );

      // TODO: add server timing report
      await serverMiddleware(customMiddlewareCtx);

      if (!c.finalized) {
        return next();
      }
    };
  }
}
