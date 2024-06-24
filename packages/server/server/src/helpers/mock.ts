import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { NextFunction } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import { AGGRED_DIR, type ServerBase } from '@modern-js/server-core';
import {
  ServerNodeMiddleware,
  connectMid2HonoMid,
} from '@modern-js/server-core/node';

type MockHandler =
  | {
      data: any;
    }
  | ((
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ) => Promise<void> | void);

type MockConfig = Record<string, MockHandler>;

const parseKey = (key: string) => {
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

const mockHandlerRegistry = new Map<
  string,
  {
    isRegistered: boolean;
    handler: MockHandler;
  }
>();

export const registerMockHandlers = async ({
  pwd,
  server,
}: {
  pwd: string;
  server: ServerBase;
  // eslint-disable-next-line consistent-return
}) => {
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
    return null;
  }

  const { default: mockModule, config } = await import(mockFilePath);

  const enable = config?.enable as
    | boolean
    | ((req: IncomingMessage, res: ServerResponse) => boolean)
    | undefined;

  if (enable === false) {
    // eslint-disable-next-line consistent-return
    return;
  }

  if (!mockModule) {
    throw new Error(`Mock file ${mockFilePath} parsed failed!`);
  }

  Object.entries(mockModule as MockConfig).forEach(([key, handler]) => {
    const { method, path } = parseKey(key);
    const methodName = method.toLowerCase() as keyof ServerBase;
    const handlerId = `${methodName}-${path}`;
    mockHandlerRegistry.set(handlerId, {
      handler,
      isRegistered: false,
    });
    if (typeof server[methodName] === 'function') {
      // eslint-disable-next-line consistent-return
      const mockHandler: ServerNodeMiddleware = async (c, next) => {
        if (typeof enable === 'function') {
          const isEnabled = enable(c.env.node.req, c.env.node.res);
          if (!isEnabled) {
            return next();
          }
        }

        const handler = mockHandlerRegistry.get(handlerId)?.handler;
        if (typeof handler === 'function') {
          await connectMid2HonoMid(handler)(c, next);
        } else {
          return c.json(handler as any);
        }
      };

      const handlerInfo = mockHandlerRegistry.get(handlerId);
      if (handlerInfo && !handlerInfo?.isRegistered) {
        // @ts-expect-error
        server[methodName](path, mockHandler);
        handlerInfo.isRegistered = true;
      }
    }
  });
};
