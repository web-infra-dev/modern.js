/* eslint-disable consistent-return */
import { ServerHookRunner } from '@core/plugin';
import { createAfterMatchCtx, createAfterRenderCtx } from '../libs/hook';
import { Middleware } from '../types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export function createCustomHookMiddleware(
  runner: ServerHookRunner,
  entryName: string,
): Middleware {
  return async (c, next) => {
    // afterMatchhook
    const afterMatchCtx = createAfterMatchCtx(c, entryName);

    // TODO: reportTiming
    await runner.afterMatch(afterMatchCtx, { onLast: noop });

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
      return;
    }

    await next();

    // afterRenderHook

    const afterRenderCtx = createAfterRenderCtx(c);

    // TODO: repoteTiming
    await runner.afterRender(afterRenderCtx, { onLast: noop });
  };
}
