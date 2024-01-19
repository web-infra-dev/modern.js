import { Middleware, ServerHookRunner } from '../types';
import { createCustomMiddlewaresCtx } from '../libs/customServer';

export function createCustomServerMiddleware(
  runner: ServerHookRunner,
  pwd: string,
): Middleware {
  // eslint-disable-next-line consistent-return
  return async (c, next) => {
    const customMiddlewareCtx = createCustomMiddlewaresCtx(c);

    // The webExtension is deprecated, so we give a empty array to it.
    const webExtension: any[] = [];

    // get api or web server handler from server-framework plugin
    const customServerMiddleware = await runner.prepareWebServer(
      {
        pwd,
        //
        config: webExtension,
      },
      { onLast: () => null as any },
    );

    // TODO: add server timing report
    await customServerMiddleware(customMiddlewareCtx);

    // TODO: set locals to honoContext

    if (!c.finalized) {
      return next();
    }
  };
}
