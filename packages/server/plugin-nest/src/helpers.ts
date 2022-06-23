import path from 'path';
import { compatRequire } from '@modern-js/utils';
import {
  INestApplication,
  Controller,
  Get,
  Post,
  Delete,
  Options,
  Put,
  Patch,
  Head,
  Req,
  Res,
} from '@nestjs/common';
import { APIHandlerInfo, HttpMethod } from '@modern-js/bff-core';
import { isSchemaHandler, InputType } from '@modern-js/bff-runtime';
import type { Request, Response } from 'express';
import typeIs from 'type-is';
import formidable from 'formidable';
import { run } from './context';
import { CustomFactory } from '.';

export const API_DIR = 'api';
export const NEST_APP_ENTRY_NAME = 'main';
export const MODULE_MODULE_FILE_EXTENSIONS = [
  '.js',
  '.mjs',
  '.ejs',
  '.ts',
  '.tsx',
];

export const getCustomApp = (
  pwd: string,
): Promise<INestApplication | CustomFactory | undefined> => {
  const entryPath = path.resolve(pwd, API_DIR, NEST_APP_ENTRY_NAME);

  return compatRequire(entryPath);
};

export const initMiddlewares = (middleware: any[]): any[] =>
  middleware.map(middlewareItem =>
    typeof middlewareItem === 'string'
      ? compatRequire(middlewareItem)
      : middlewareItem,
  );

export const generateControllers = (handlerInfos: APIHandlerInfo[]): any[] =>
  handlerInfos.map(createController).filter(Boolean);

export const getMiddleware =
  ({ handler }: APIHandlerInfo) =>
  async (request: Request, response: Response) => {
    const input = await getInputFromRequest(request);

    if (isSchemaHandler(handler)) {
      const result = await run({ request: request as any, response }, () =>
        handler(input),
      );
      if (result.type !== 'HandleSuccess') {
        if (result.type === 'InputValidationError') {
          response.status(400);
        } else {
          response.status(500);
        }
        response.json(result.message);
      } else {
        response.json(result.value);
      }
    } else {
      const args = Object.values(input.params as any).concat(input);
      const body = await run({ request: request as any, response }, () =>
        handler(...args),
      );
      response.json(body);
    }

    response.end();
  };

const createController = ({ name, httpMethod, handler }: APIHandlerInfo) => {
  let methodDecorator = Get;
  switch (httpMethod) {
    case HttpMethod.Get: {
      methodDecorator = Get;
      break;
    }
    case HttpMethod.Post: {
      methodDecorator = Post;
      break;
    }
    case HttpMethod.Delete: {
      methodDecorator = Delete;
      break;
    }
    case HttpMethod.Option: {
      methodDecorator = Options;
      break;
    }
    case HttpMethod.Put: {
      methodDecorator = Put;
      break;
    }
    case HttpMethod.Patch: {
      methodDecorator = Patch;
      break;
    }
    case HttpMethod.Head: {
      methodDecorator = Head;
      break;
    }
    default: {
      methodDecorator = Get;
      break;
    }
  }

  @Controller(name)
  class AppController {
    @methodDecorator()
    async [name](@Req() request: Request, @Res() response: Response) {
      const input = await getInputFromRequest(request);

      if (isSchemaHandler(handler)) {
        return run({ request: request as any, response }, () => handler(input));
      } else {
        const args = Object.values(input.params as any).concat(input);
        return run({ request: request as any, response }, () =>
          handler(...args),
        );
      }
    }
  }

  return AppController;
};

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
