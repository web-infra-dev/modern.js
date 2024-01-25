import { ServerRoute } from '@modern-js/types';
import { Metrics, Middleware, ServerHookRunner, Logger } from '../types';
import {
  createAfterMatchCtx,
  createAfterRenderCtx,
  createCustomMiddlewaresCtx,
  createAfterStreamingRenderContext,
} from '../libs/customServer';
import { createInjectStream } from '../libs/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export class CustomServer {
  private runner: ServerHookRunner;

  private logger: Logger;

  private metrics?: Metrics;

  private serverMiddlewarePromise: ReturnType<
    ServerHookRunner['prepareWebServer']
  >;

  constructor(
    runner: ServerHookRunner,
    pwd: string,
    logger: Logger,
    metrics?: Metrics,
  ) {
    this.runner = runner;

    this.metrics = metrics;

    this.logger = logger;

    // The webExtension is deprecated, so we give a empty array to it.
    const webExtension: any[] = [];

    // get api or web server handler from server-framework plugin
    // prepareWebServe must run before server runner.
    this.serverMiddlewarePromise = runner.prepareWebServer(
      {
        pwd,
        config: webExtension,
      },
      { onLast: () => null },
    );
  }

  getHookMiddleware(entryName: string, routeInfo: ServerRoute): Middleware {
    // eslint-disable-next-line consistent-return
    return async (c, next) => {
      // afterMatchhook
      const afterMatchCtx = createAfterMatchCtx(
        c,
        entryName,
        this.logger,
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

      // TODO: how to rewrite to another entry
      // if (entryName !== current) {
      //   const matched = this.router.matchEntry(current);
      //   if (!matched) {
      //     this.render404(context);
      //     return;
      //   }
      //   route = matched.generate(context.url);
      // }

      if (c.finalized) {
        // eslint-disable-next-line consistent-return
        return;
      }

      await next();

      if (routeInfo.isStream) {
        // run afterStreamingRender hook
        const afterStreamingRenderContext = createAfterStreamingRenderContext(
          c,
          this.logger,
          routeInfo,
          this.metrics,
        );

        const injectStream = createInjectStream((chunk: string) => {
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
          this.logger,
          this.metrics,
        );

        // TODO: repoteTiming
        await this.runner.afterRender(afterRenderCtx, { onLast: noop });

        const newBody = afterRenderCtx.template.get();

        const { headers, status, statusText } = c.res;
        c.res = c.body(newBody, {
          status,
          headers,
          statusText,
        });
      }
    };
  }

  getServerMiddleware(): Middleware {
    // eslint-disable-next-line consistent-return
    return async (c, next) => {
      const serverMiddleware = await this.serverMiddlewarePromise;
      if (!serverMiddleware) {
        return next();
      }

      const customMiddlewareCtx = createCustomMiddlewaresCtx(
        c,
        this.logger,
        this.metrics,
      );

      // TODO: add server timing report
      await serverMiddleware(customMiddlewareCtx);
      // TODO: set locals to honoContext

      if (!c.finalized) {
        return next();
      }
    };
  }
}
