import type { APIHandlerInfo } from '@modern-js/bff-core';
import {
  HttpMetadata,
  type ResponseMeta,
  ResponseMetaType,
  ValidationError,
  isWithMetaHandler,
} from '@modern-js/bff-core';
import type { Context, Next } from '@modern-js/server-core';
import { parse } from 'qs';
import typeIs from 'type-is';

type Handler = APIHandlerInfo['handler'];

const createHonoRoutes = (handlerInfos: APIHandlerInfo[] = []) => {
  return handlerInfos.map(({ routePath, handler, httpMethod }) => {
    const routeMiddlwares = Reflect.getMetadata('middleware', handler) || [];
    const honoHandler = createHonoHandler(handler);

    return {
      method: httpMethod.toLowerCase() as any,
      path: routePath,
      handler:
        routeMiddlwares.length > 0
          ? [...routeMiddlwares, honoHandler]
          : honoHandler,
    };
  });
};

const handleResponseMeta = (c: Context, handler: Handler) => {
  const responseMeta: ResponseMeta[] = Reflect.getMetadata(
    HttpMetadata.Response,
    handler,
  );
  if (Array.isArray(responseMeta)) {
    for (const meta of responseMeta) {
      switch (meta.type) {
        case ResponseMetaType.Headers:
          for (const [key, value] of Object.entries(meta.value as object)) {
            c.header(key, value as string);
          }
          break;
        case ResponseMetaType.Redirect:
          return c.redirect(meta.value as string);
        case ResponseMetaType.StatusCode:
          c.status(meta.value as any);
          break;
        default:
          break;
      }
    }
  }
  return null;
};

export const createHonoHandler = (handler: Handler) => {
  return async (c: Context) => {
    const input = await getHonoInput(c);

    if (isWithMetaHandler(handler)) {
      try {
        const response = handleResponseMeta(c, handler);
        if (response) {
          return response;
        }
        if (c.finalized) return;

        const result = await handler(input);
        if (result instanceof Response) {
          return result;
        }
        return result && typeof result === 'object'
          ? c.json(result)
          : c.body(result);
      } catch (error) {
        if (error instanceof ValidationError) {
          c.status((error as any).status);

          return c.json({
            message: error.message,
          });
        }
        throw error;
      }
    } else {
      const routePath = c.req.routePath;
      const paramNames = routePath.match(/:\w+/g)?.map(s => s.slice(1)) || [];
      const params = Object.fromEntries(
        paramNames.map(name => [name, input.params[name]]),
      );
      const args = Object.values(params).concat(input);

      const body = await handler(...args);
      if (c.finalized) {
        return await Promise.resolve();
      }

      if (typeof body !== 'undefined') {
        if (body instanceof Response) {
          return body;
        }
        return c.json(body);
      }
    }
  };
};

const getHonoInput = async (c: Context) => {
  const draft: Record<string, any> = {
    params: c.req.param(),
    query: parse(c.req.query()),
    headers: c.req.header(),
    cookies: c.req.header('cookie'),
  };

  try {
    const contentType = c.req.header('content-type') || '';

    if (typeIs.is(contentType, ['application/json'])) {
      draft.data = await c.req.json();
    } else if (typeIs.is(contentType, ['multipart/form-data'])) {
      draft.formData = await c.req.parseBody();
    } else if (typeIs.is(contentType, ['application/x-www-form-urlencoded'])) {
      draft.formUrlencoded = await c.req.parseBody();
    } else {
      draft.body = await c.req.json();
    }
  } catch (error) {
    draft.body = null;
  }
  return draft;
};

export default createHonoRoutes;
