import { HttpMethod, httpMethods, APIHandlerInfo } from '@modern-js/bff-core';
import { isSchemaHandler, InputType } from '@modern-js/bff-runtime';
import type { Context, Router } from 'egg';
import typeIs from 'type-is';
import { sortDynamicRoutes } from '@modern-js/adapter-helpers';
import { createDebugger } from '@modern-js/utils';
import { run } from '../context';

const debug = createDebugger('plugin-egg');

const registerRoutes = (router: Router, handlerInfos: APIHandlerInfo[]) => {
  sortDynamicRoutes(handlerInfos);
  handlerInfos.forEach(({ routePath, routeName, handler, httpMethod }) => {
    const wrappedHandler = async (ctx: Context) => {
      const input = await getInputFromRequest(ctx);

      if (isSchemaHandler(handler)) {
        const result = await run(ctx, () => handler(input));
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
        ctx.body = await run(ctx, () => handler(...args));
      }
    };

    Object.defineProperties(
      wrappedHandler,
      Object.getOwnPropertyDescriptors(handler),
    );

    if (isNormalMethod(httpMethod)) {
      const method = httpMethod.toLowerCase();
      debug('route', method, routePath);
      (router as any)[method](routeName, wrappedHandler);
    } else {
      throw new Error(`Unknown HTTP Method: ${httpMethod}`);
    }
  });
};

const isNormalMethod = (httpMethod: HttpMethod): httpMethod is HttpMethod =>
  httpMethods.includes(httpMethod);

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
