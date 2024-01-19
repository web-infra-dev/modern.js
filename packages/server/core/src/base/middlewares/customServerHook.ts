import { AfterMatchContext, AfterRenderContext } from '@modern-js/types';
import { ServerHookRunner } from '@core/plugin';
import { Middleware } from '../types';

export function createCustomHookMiddleware(
  runner: ServerHookRunner,
): Middleware {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = () => {};

  return async (c, next) => {
    // afterMatchhook
    const isSend = true;
    const afterMatchCtx = createAfterMatchCtx();

    // TODO: reportTiming
    await runner.afterMatch(afterMatchCtx, { onLast: noop });

    const { current, url, status } = afterMatchCtx.router;

    if (url) {
      return c.redirect(url, status);
    }

    // TODO: how to rewrite to another entry
    // 1. use redirect

    if (isSend) {
      return;
    }

    await next();

    // afterRenderHook

    // only run in string

    const afterRenderCtx = createAfterRenderCtx();

    await runner.afterRender(afterRenderCtx, { onLast: noop });

    if (isSend) {
      return;
    }

    const html = getHtmlFromRenderCtx(afterRenderCtx);

    // set new html to response
    c.res = await c.html(html);
  };
}

function createAfterMatchCtx(): AfterMatchContext {
  throw new Error('TODO:');
}

function createAfterRenderCtx(): AfterRenderContext {
  throw new Error('TODO:');
}

function getHtmlFromRenderCtx(ctx: AfterRenderContext): string {
  throw new Error('TODO:');
}
