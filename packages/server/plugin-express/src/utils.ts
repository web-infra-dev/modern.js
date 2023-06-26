/* eslint-disable consistent-return */
import 'reflect-metadata';
import {
  HttpMethod,
  httpMethods,
  isWithMetaHandler,
  isInputParamsDeciderHandler,
  ResponseMeta,
  HttpMetadata,
  ResponseMetaType,
  ValidationError,
} from '@modern-js/bff-core';
import type { APIHandlerInfo } from '@modern-js/bff-core';
import { isSchemaHandler } from '@modern-js/bff-runtime';
import type { Request, Response, NextFunction } from 'express';
import typeIs from 'type-is';
import formidable from 'formidable';

type Handler = APIHandlerInfo['handler'];

const handleResponseMeta = (res: Response, handler: Handler) => {
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
          // eslint-disable-next-line @typescript-eslint/ban-types
          for (const [key, value] of Object.entries(metaValue as {})) {
            res.append(key, value as string);
          }
          break;
        case ResponseMetaType.Redirect:
          res.redirect(metaValue as string);
          break;
        case ResponseMetaType.StatusCode:
          res.status(metaValue as number);
          break;
        default:
          break;
      }
    }
  }
};

export const createRouteHandler = (handler: Handler) => {
  const apiHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const input = await getInputFromRequest(req);
    if (isWithMetaHandler(handler)) {
      try {
        handleResponseMeta(res, handler);
        if (res.headersSent) {
          return;
        }
        const result = await handler(input);
        if (result && typeof result === 'object') {
          return res.json(result);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          res.status((error as any).status);

          return res.json({
            message: error.message,
          });
        }
        throw error;
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
    } else if (isInputParamsDeciderHandler(handler)) {
      try {
        const args = input?.data?.args || [];
        const body = await handler(...args);
        if (typeof body !== 'undefined') {
          // we can't currently use res.send to handle object here
          // because the send function is not provided by express
          // it is assigned first in the packages/server/prod-server/src/libs/context/context.ts
          if (typeof body === 'object') {
            return res.json(body);
          }
          return res.send(body);
        }
      } catch (e) {
        return next(e);
      }
    } else {
      const args = Object.values(input.params).concat(input);

      try {
        const body = await handler(...args);

        // this should never happen
        if (res.headersSent) {
          return await Promise.resolve();
        }

        if (typeof body !== 'undefined') {
          return res.json(body);
        }
      } catch (e) {
        return next(e);
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

const getInputFromRequest = async (request: Request) => {
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

  return draft;
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
