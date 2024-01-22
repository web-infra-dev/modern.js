import { Middleware, ServerHookRunner } from '../types';
import {
  createAfterMatchCtx,
  createAfterRenderCtx,
  createCustomMiddlewaresCtx,
} from '../libs/customServer';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export class CustomServer {
  private runner: ServerHookRunner;

  private serverMiddlewarePromise: ReturnType<
    ServerHookRunner['prepareWebServer']
  >;

  constructor(runner: ServerHookRunner, distDir: string) {
    this.runner = runner;

    // The webExtension is deprecated, so we give a empty array to it.
    const webExtension: any[] = [];

    // get api or web server handler from server-framework plugin
    // prepareWebServe must run before server runner.
    this.serverMiddlewarePromise = runner.prepareWebServer(
      {
        pwd: distDir,
        //
        config: webExtension,
      },
      { onLast: () => null as any },
    );
  }

  getHookMiddleware(entryName: string): Middleware {
    // eslint-disable-next-line consistent-return
    return async (c, next) => {
      // afterMatchhook
      const afterMatchCtx = createAfterMatchCtx(c, entryName);

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

      // afterRenderHook

      const afterRenderCtx = createAfterRenderCtx(c);

      // TODO: repoteTiming
      await this.runner.afterRender(afterRenderCtx, { onLast: noop });
    };
  }

  getServerMiddleware(): Middleware {
    // eslint-disable-next-line consistent-return
    return async (c, next) => {
      const customMiddlewareCtx = createCustomMiddlewaresCtx(c);

      // TODO: add server timing report
      const serverMiddleware = await this.serverMiddlewarePromise;
      await serverMiddleware(customMiddlewareCtx);
      // TODO: set locals to honoContext

      if (!c.finalized) {
        return next();
      }
    };
  }
}
