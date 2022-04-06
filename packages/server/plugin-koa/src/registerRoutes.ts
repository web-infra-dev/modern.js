import { HttpMethod, useAPIHandlerInfos } from '@modern-js/bff-utils';
import { isSchemaHandler, InputType } from '@modern-js/bff-runtime';
import Router from 'koa-router';
import { Context } from 'koa';
import typeIs from 'type-is';
import { sortDynamicRoutes } from '@modern-js/adapter-helpers';
import { createDebugger } from '@modern-js/utils';

const debug = createDebugger('koa');

const registerRoutes = (router: Router, prefix?: string) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handlerInfos = useAPIHandlerInfos();
  sortDynamicRoutes(handlerInfos);
  debug('handlerInfos', handlerInfos);

  if (prefix) {
    router.prefix(prefix);
  }

  handlerInfos.forEach(({ handler, method, name }) => {
    const wrapedHandler = async (ctx: Context) => {
      const input = await getInputFromRequest(ctx);

      if (isSchemaHandler(handler)) {
        const result = await handler(input);
        if (result.type !== 'HandleSuccess') {
          if (result.type === 'InputValidationError') {
            ctx.status = 400;
          } else {
            ctx.status = 500;
          }
          ctx.body = result.message;
        } else {
          ctx.body = result.value;
        }
      } else {
        const args = Object.values(input.params as any).concat(input);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        ctx.body = await handler(...args);
      }
    };

    Object.defineProperties(
      wrapedHandler,
      Object.getOwnPropertyDescriptors(handler),
    );

    if (isNormalMethod(method)) {
      const routeName = method.toLowerCase();
      (router as any)[routeName](name, wrapedHandler);
    } else {
      throw new Error(`Unknown HTTP Method: ${method}`);
    }
  });
};

const isNormalMethod = (method: string): method is HttpMethod =>
  Object.keys(HttpMethod).includes(method);

export default registerRoutes;

const getInputFromRequest = async (ctx: Context): Promise<InputType> => {
  const draft: Record<string, any> = {
    params: ctx.params,
    query: ctx.query,
    headers: ctx.headers,
    cookies: ctx.headers.cookie,
  };

  if (typeIs.is(ctx.request.type, ['application/json'])) {
    draft.data = ctx.request.body;
  } else if (typeIs.is(ctx.request.type, ['multipart/form-data'])) {
    draft.formData = ctx.request.files;
  } else if (
    typeIs.is(ctx.request.type, ['application/x-www-form-urlencoded'])
  ) {
    draft.formUrlencoded = ctx.request.body;
  } else {
    draft.body = ctx.request.body;
  }

  return draft as any;
};
