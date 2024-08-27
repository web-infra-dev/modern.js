import {
  type APIHandlerInfo,
  HttpMetadata,
  type HttpMethod,
  type ResponseMeta,
  ResponseMetaType,
  httpMethods,
  isWithMetaHandler,
} from '@modern-js/bff-core';
import { type InputType, isSchemaHandler } from '@modern-js/bff-runtime';
import type { Context } from 'koa';
import typeIs from 'type-is';

type Handler = APIHandlerInfo['handler'];

const handleResponseMeta = (ctx: Context, handler: Handler) => {
  const responseMeta: ResponseMeta[] = Reflect.getMetadata(
    HttpMetadata.Response,
    handler,
  );
  if (Array.isArray(responseMeta)) {
    for (const meta of responseMeta) {
      const metaType = meta.type;
      const metaValue = meta.value;
      switch (metaType) {
        case ResponseMetaType.Headers:
          for (const [key, value] of Object.entries(metaValue as {})) {
            if (typeof value === 'string') {
              ctx.append(key, value);
            }
          }
          break;
        case ResponseMetaType.Redirect:
          if (typeof metaValue === 'string') {
            ctx.redirect(metaValue);
          }
          break;
        case ResponseMetaType.StatusCode:
          if (typeof metaValue === 'number') {
            ctx.status = metaValue;
          }
          break;
        default:
          break;
      }
    }
  }
};

export const createRouteHandler = (handler: Handler) => {
  const apiHandler = async (ctx: Context) => {
    const input = await getInputFromRequest(ctx);
    if (isWithMetaHandler(handler)) {
      try {
        handleResponseMeta(ctx, handler);
        const body = await handler(input);
        if (typeof body !== 'undefined') {
          ctx.body = body;
        }
      } catch (error) {
        if (error instanceof Error) {
          if ((error as any).status) {
            ctx.status = (error as any).status;
          } else {
            ctx.status = 500;
          }
          return (ctx.body = {
            code: (error as any).code,
            message: error.message,
          });
        }
      }
    } else if (isSchemaHandler(handler)) {
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
      const body = await handler(...args);
      if (typeof body !== 'undefined') {
        ctx.body = body;
      }
    }
  };

  Object.defineProperties(
    apiHandler,
    Object.getOwnPropertyDescriptors(handler),
  );

  return apiHandler;
};

export const isNormalMethod = (
  httpMethod: HttpMethod,
): httpMethod is HttpMethod => httpMethods.includes(httpMethod);

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
