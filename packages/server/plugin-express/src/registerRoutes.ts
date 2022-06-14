import 'reflect-metadata';
import {
  HttpMethod,
  httpMethods,
  APIHandlerInfo,
  isWithMetaHandler,
  HttpMetadata,
} from '@modern-js/bff-core';
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

const registerRoutes = (app: Express, apiHandlerInfos: APIHandlerInfo[]) => {
  const handlerInfos = apiHandlerInfos;
  sortDynamicRoutes(handlerInfos);
  debug('handlerInfos', handlerInfos);

  handlerInfos.forEach(({ routePath, handler, httpMethod }) => {
    const wrappedHandler: RequestHandler = async (
      req: Request,
      res: Response,
      next: NextFunction,
      // eslint-disable-next-line consistent-return
    ) => {
      const input = await getInputFromRequest(req);
      if (isWithMetaHandler(handler)) {
        try {
          const headers = Reflect.getMetadata(
            HttpMetadata.ResponseHeaders,
            handler,
          );
          if (headers) {
            for (const [key, value] of Object.entries(headers)) {
              res.append(key, value as string);
            }
          }
          const result = await handler(input);
          return res.json(result);
        } catch (error) {
          if (error instanceof Error) {
            if ((error as any).status) {
              res.status((error as any).status);
            } else {
              res.status(500);
            }
            return res.json({
              message: error.message,
            });
          }
        }
      } else if (isSchemaHandler(handler)) {
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

          return res.json(body);
        } catch (e) {
          return next(e);
        }
      }
    };

    Object.defineProperties(
      wrappedHandler,
      Object.getOwnPropertyDescriptors(handler),
    );

    if (isNormalMethod(httpMethod)) {
      const method = httpMethod.toLowerCase();
      (app as any)[method](routePath, wrappedHandler);
    } else {
      throw new Error(`Unknown HTTP Method: ${httpMethod}`);
    }
  });
};

const isNormalMethod = (httpMethod: HttpMethod): httpMethod is HttpMethod =>
  httpMethods.includes(httpMethod);

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
    draft.formData = await resolveFormData(request);
  } else if (typeIs(request, ['application/x-www-form-urlencoded'])) {
    draft.formUrlencoded = request.body;
  } else {
    draft.body = request.body;
  }

  return draft as any;
};

const resolveFormData = (request: Request): Promise<Record<string, any>> => {
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
