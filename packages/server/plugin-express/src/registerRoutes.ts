import { HttpMethod, useAPIHandlerInfos } from '@modern-js/bff-utils';
import { isSchemaHandler, InputType } from '@modern-js/bff-runtime';
import {
  Express,
  Request,
  Response,
  RequestHandler,
  NextFunction,
} from 'express';
import typeIs from 'type-is';
import formidable from 'formidable';
import { sortDynamicRoutes } from '@modern-js/adapter-helpers';
import { createDebugger } from '@modern-js/utils';

const debug = createDebugger('express');

const registerRoutes = (app: Express) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handlerInfos = useAPIHandlerInfos();
  sortDynamicRoutes(handlerInfos);
  debug('handlerInfos', handlerInfos);

  handlerInfos.forEach(({ path, handler, method, name }) => {
    const wrapedHandler: RequestHandler = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const input = await getInputFromRequest(req);

      if (isSchemaHandler(handler)) {
        const result = await handler(input);
        if (result.type !== 'HandleSuccess') {
          if (result.type === 'InputValidationError') {
            res.status(400);
          } else {
            res.status(500);
          }
          return res.json(result.message);
        } else {
          res.status(200);
          return res.json(result.value);
        }
      } else {
        const args = Object.values(input.params as any).concat(input);

        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          const body = await handler(...args);

          // this should never happen
          if (res.headersSent) {
            return await Promise.resolve();
          }

          res.status(200);
          return res.json(body);
        } catch (e) {
          return next(e);
        }
      }
    };

    Object.defineProperties(
      wrapedHandler,
      Object.getOwnPropertyDescriptors(handler),
    );

    if (isNormalMethod(method)) {
      const routeName = method.toLowerCase();
      (app as any)[routeName](path || name, wrapedHandler);
    } else {
      throw new Error(`Unknown HTTP Method: ${method}`);
    }
  });
};

const isNormalMethod = (method: string): method is HttpMethod =>
  Object.keys(HttpMethod).includes(method);

export default registerRoutes;

const getInputFromRequest = async (request: Request): Promise<InputType> => {
  const draft: Record<string, any> = {
    params: request.params,
    query: request.query,
    headers: request.headers,
    cookies: request.headers.cookie,
  };

  if (typeIs(request, ['application/json'])) {
    draft.data = request.body;
  } else if (typeIs(request, ['multipart/form-data'])) {
    draft.formData = await resvoleFormData(request);
  } else if (typeIs(request, ['application/x-www-form-urlencoded'])) {
    draft.formUrlencoded = request.body;
  } else {
    draft.body = request.body;
  }

  return draft as any;
};

const resvoleFormData = (request: Request): Promise<Record<string, any>> => {
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
