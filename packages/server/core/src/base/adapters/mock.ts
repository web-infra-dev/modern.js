import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { NextFunction } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import type { ServerBase } from '../serverBase';
import type { ServerNodeMiddleware } from '../types';
import { AGGRED_DIR } from '../libs/constants';

type MockConfig = Record<
  string,
  | {
      data: any;
    }
  | ((
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ) => Promise<void>)
>;

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

export const registerMockHandler = async ({
  pwd,
  server,
}: {
  pwd: string;
  server: ServerBase;
  // eslint-disable-next-line consistent-return
}) => {
  const exts = ['.ts', '.js'];
  let filepath = '';

  for (const ext of exts) {
    const maybeMatch = path.join(pwd, `${AGGRED_DIR.mock}/index${ext}`);
    if (await fs.pathExists(maybeMatch)) {
      filepath = maybeMatch;
      break;
    }
  }

  if (!filepath) {
    return null;
  }

  const { default: mockModule, config } = await import(filepath);

  const enable = config?.enable as
    | boolean
    | ((req: IncomingMessage, res: ServerResponse) => boolean)
    | undefined;

  if (enable === false) {
    // eslint-disable-next-line consistent-return
    return;
  }

  if (!mockModule) {
    throw new Error(`Mock file ${filepath} parsed failed!`);
  }

  Object.entries(mockModule as MockConfig).forEach(([key, handler]) => {
    const { method, path } = parseKey(key);

    const methodName = method.toLowerCase() as keyof ServerBase;
    if (typeof server[methodName] === 'function') {
      // @ts-expect-error
      // eslint-disable-next-line consistent-return
      server[methodName](path, (async (c, next) => {
        if (typeof enable === 'function') {
          const isEnabled = enable(c.env.node!.req, c.env.node!.res);
          if (!isEnabled) {
            return next();
          }
        }

        if (typeof handler === 'function') {
          await handler(c.env.node!.req, c.env.node!.res, next);
        } else {
          return c.json(handler as any);
        }
      }) as ServerNodeMiddleware);
    }
  });
};
