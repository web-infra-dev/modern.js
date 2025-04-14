import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';
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
          return c.redirect(meta.value as string);
        case ResponseMetaType.StatusCode:
          c.status(meta.value as number);
          break;
        default:
          break;
      }
    }
  }
  return null;
};

export const createHonoHandler = (handler: Handler) => {
  return async (c: Context, next: Next) => {
    try {
      const input = await getHonoInput(c);

      if (isWithMetaHandler(handler)) {
        try {
          const response = handleResponseMeta(c, handler);
          if (response) {
            return response;
          }
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
      draft.data = await c.req.json();
    } else if (typeIs.is(contentType, ['multipart/form-data'])) {
      const nodeStream = await webStreamToNodeStream(c);
      draft.formData = await resolveFormData(nodeStream);
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

async function webStreamToNodeStream(c: Context) {
  const reader = (c.req.raw.body as ReadableStream<Uint8Array>).getReader();
  const nodeStream = new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
        } else {
          this.push(value);
        }
      } catch (err) {
        this.destroy(err as any);
      }
    },
    destroy(err, callback) {
      reader.cancel(err).finally(() => callback(err));
    },
  }) as IncomingMessage;

  const headers = {
    'content-type': c.req.header('content-type') || 'multipart/form-data',
    'content-length': c.req.header('content-length') || '0',
  };

  nodeStream.headers = headers;
  return nodeStream;
}

const resolveFormData = (
  request: IncomingMessage,
): Promise<Record<string, any>> => {
  const form = formidable({ multiples: true });
  return new Promise((resolve, reject) => {
    form.parse(request, (err, fields, files) => {
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
