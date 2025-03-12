import type { APIHandlerInfo } from '@modern-js/bff-core';
import {
  HttpMetadata,
  type ResponseMeta,
  ResponseMetaType,
  ValidationError,
  isWithMetaHandler,
} from '@modern-js/bff-core';
import formidable from 'formidable';
import type { Context, Next } from 'hono';
import typeIs from 'type-is';

type Handler = APIHandlerInfo['handler'];

const createHonoRoutes = (handlerInfos: APIHandlerInfo[]) => {
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
          c.redirect(meta.value as string);
          break;
        case ResponseMetaType.StatusCode:
          c.status(meta.value as number);
          break;
        default:
          break;
      }
    }
  }
};

export const createHonoHandler = (handler: Handler) => {
  return async (c: Context, next: Next) => {
    try {
      const input = await getHonoInput(c);

      if (isWithMetaHandler(handler)) {
        try {
          handleResponseMeta(c, handler);
          if (c.env?.node?.res?.headersSent) return;

          const result = await handler(input);
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
        const args = Object.values(input.params).concat(input);
        try {
          const body = await handler(...args);
          if (c.env?.node?.res?.headersSent) {
            return await Promise.resolve();
          }

          if (typeof body !== 'undefined') {
            return c.json(body);
          }
        } catch {
          return next();
        }
      }
    } catch (error) {
      next();
    }
  };
};

const getHonoInput = async (c: Context) => {
  const draft: Record<string, any> = {
    params: c.req.param(),
    query: c.req.query(),
    headers: c.req.header(),
    cookies: c.req.header('cookie'),
  };

  try {
    const contentType = c.req.header('content-type') || '';
    if (typeIs.is(contentType, ['application/json'])) {
      try {
        draft.data = await c.req.json();
      } catch {
        draft.data = {};
      }
    } else if (typeIs.is(contentType, ['multipart/form-data'])) {
      const formData = await resolveHonoFormData(c);
      draft.formData = formData;
    } else if (typeIs.is(contentType, ['application/x-www-form-urlencoded'])) {
      draft.formUrlencoded = await c.req.parseBody();
    } else {
      draft.body = await c.req.parseBody();
    }
  } catch (error) {
    draft.body = null;
  }
  return draft;
};

const resolveHonoFormData = (c: Context): Promise<Record<string, any>> => {
  const form = formidable({ multiples: true });
  return new Promise((resolve, reject) => {
    form.parse(c.env.node?.req, (err, fields, files) => {
      if (err) {
        reject(err);
      }

      resolve({
        ...fields,
        ...files,
      });
    });
  });
};

export default createHonoRoutes;
