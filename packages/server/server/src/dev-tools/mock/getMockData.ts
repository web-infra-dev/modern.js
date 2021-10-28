import { IncomingMessage, ServerResponse } from 'http';
import { compatRequire } from '@modern-js/utils';
import { NextFunction } from '../../type';
import { ModernServerContext } from '../../libs/context';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VALID_METHODS = ['get', 'post', 'put', 'delete', 'patch'];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BODY_PARSED_METHODS = ['post', 'put', 'delete', 'patch'];

export type MockConfig = Record<
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

export type MockApi = {
  method: string;
  path: string;
  handler: ReturnType<
    typeof createFunctionDataHandler | typeof createStaticDataHandler
  >;
};

const createFunctionDataHandler =
  (
    method: string,
    handler: (
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ) => void,
  ) =>
  async (context: ModernServerContext, next: NextFunction) => {
    const { req, res } = context;
    return handler(req, res, next);
  };

const createStaticDataHandler =
  (method: string, handler: Record<string, any>) =>
  (context: ModernServerContext) => {
    const { res } = context;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(handler));
  };

const allowTypes = ['object', 'function'];
const normalizeConfig = (mockConfig: MockConfig) =>
  Object.keys(mockConfig).reduce((acc, key) => {
    const handler = mockConfig[key];
    const type = typeof handler;

    if (!allowTypes.includes(type)) {
      throw new Error(
        `mock value of ${key} should be object or function, but got ${type}`,
      );
    }

    const meta = parseKey(key);
    if (type === 'object') {
      acc.push({
        ...meta,
        handler: createStaticDataHandler(meta.method, handler),
      });
    } else {
      acc.push({
        ...meta,
        handler: createFunctionDataHandler(meta.method, handler as any),
      });
    }

    return acc;
  }, [] as MockApi[]);

const _blank = ' ';
const parseKey = (key: string) => {
  // 'Method /pathname' | '/pathname'
  const splited = key.split(_blank).filter(Boolean);
  if (splited.length > 1) {
    const [method, pathname] = splited;
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

export default (filepath: string) => {
  const mockModule = compatRequire(filepath);

  if (!mockModule) {
    throw new Error(`Mock file ${filepath} parsed failed!`);
  }

  const data = normalizeConfig(mockModule);
  return data;
};
