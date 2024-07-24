import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { NextFunction } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import {
  AGGRED_DIR,
  type Middleware,
  InternalRequest,
} from '@modern-js/server-core';
import { connectMid2HonoMid } from '@modern-js/server-core/node';
import { match } from 'path-to-regexp';

/** Types: Mock  */
type MockHandler =
  | {
      data: any;
    }
  | ((
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ) => Promise<void> | void);

type MockAPI = {
  method: string;

  path: string;

  handler: MockHandler;
};

type MockHandlers = Record<string, MockHandler>;

type MockConfig = {
  enable: ((req: IncomingMessage, res: ServerResponse) => boolean) | boolean;
};

type MockModule = {
  default: MockHandlers;
  config?: MockConfig;
};

let mockAPIs: MockAPI[] = [];

let mockConfig: MockConfig | undefined;

const parseKey = (key: string): { method: string; path: string } => {
  const _blank = ' ';
  // 'Method /pathname' | '/pathname'
  const splitted = key.split(_blank).filter(Boolean);
  if (splitted.length > 1) {
    const [method, pathname] = splitted;
    return {
      method: method.toLowerCase(),
      path: pathname,
    };
  }

  // default return get method
  return {
    method: 'get',
    path: key,
  };
};

const getMockModule = async (
  pwd: string,
): Promise<
  | {
      mockHandlers?: MockHandlers;
      config?: MockConfig;
    }
  | undefined
> => {
  const exts = ['.ts', '.js'];
  let mockFilePath = '';

  for (const ext of exts) {
    const maybeMatch = path.join(pwd, `${AGGRED_DIR.mock}/index${ext}`);
    if (await fs.pathExists(maybeMatch)) {
      mockFilePath = maybeMatch;
      break;
    }
  }

  if (!mockFilePath) {
    return undefined;
  }

  const { default: mockHandlers, config } = (await import(
    mockFilePath
  )) as MockModule;

  const enable = config?.enable as
    | boolean
    | ((req: IncomingMessage, res: ServerResponse) => boolean)
    | undefined;

  if (enable === false) {
    return undefined;
  }

  if (!mockHandlers) {
    throw new Error(`Mock file ${mockFilePath} parsed failed!`);
  }

  return {
    mockHandlers,
    config,
  };
};

export const getMatched = (request: InternalRequest, mockApis: MockAPI[]) => {
  const { path: targetPathname, method: targetMethod } = request;

  const matched = mockApis.find(mockApi => {
    const { method, path: pathname } = mockApi;
    if (method.toLowerCase() === targetMethod.toLowerCase()) {
      return match(pathname, {
        encode: encodeURI,
        decode: decodeURIComponent,
      })(targetPathname);
    }

    return false;
  });

  return matched;
};

export async function initOrUpdateMockMiddlewares(pwd: string) {
  const mockModule = await getMockModule(pwd);

  mockConfig = mockModule?.config;

  mockAPIs = Object.entries(mockModule?.mockHandlers || {}).map(
    ([key, handler]) => {
      const { method, path } = parseKey(key);

      return {
        method,
        path,
        handler,
      };
    },
  );
}

export async function getMockMiddleware(pwd: string): Promise<Middleware> {
  await initOrUpdateMockMiddlewares(pwd);

  const mockMiddleware: Middleware = async (c, next) => {
    if (typeof mockConfig?.enable === 'function') {
      const isEnabled = mockConfig.enable(c.env.node.req, c.env.node.res);
      if (!isEnabled) {
        return next();
      }
    }

    const matchedMockAPI = getMatched(c.req, mockAPIs);

    if (matchedMockAPI) {
      const { handler } = matchedMockAPI;

      if (typeof handler === 'function') {
        return await connectMid2HonoMid(handler)(c, next);
      } else {
        return c.json(handler);
      }
    }

    return next();
  };

  return mockMiddleware;
}
