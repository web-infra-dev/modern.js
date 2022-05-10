import path from 'path';
import { isHandler, Handler, SchemaHandler } from '@modern-js/bff-runtime';
import { getAllAPIFiles, getLambdaDir } from '../utils';
import { HttpMethod, INDEX_SUFFIX } from '../constant';

export const extractAPIHandlers = (_apiDir: string) => {
  const apiDir = path.resolve(_apiDir);

  const lambdaDir = getLambdaDir(apiDir);

  const filenames = getAllAPIFiles(lambdaDir);

  const moduleInfos = extractModuleInfoFromFilenames(lambdaDir, filenames);

  return extractAPIHandlersFromModuleInfos(moduleInfos);
};

export type HandlerModule = Record<string, any>;
export type ModuleInfo = {
  filename: string;
  module: HandlerModule;
  name: string;
};

export const extractModuleInfoFromFilenames = (
  apiDir: string,
  filenames: string[],
) => {
  const moduleInfos: ModuleInfo[] = [];

  filenames.forEach(filename => {
    try {
      const module = requireModule(filename);
      const name = getRouteName(apiDir, filename);

      moduleInfos.push({
        filename,
        module,
        name,
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      } else {
        console.error(err);
      }
    }
  });

  return moduleInfos;
};

export type APIHandlerInfo = {
  handler: Handler<any, any> | SchemaHandler<any, any>;
  method: string;
  name: string;
};

export const extractAPIHandlersFromModuleInfos = (
  moduleInfos: ModuleInfo[],
) => {
  const apiHandlers: APIHandlerInfo[] = [];

  moduleInfos.forEach(({ name, module }) => {
    Object.keys(module).forEach(key => {
      const handler = module[key];
      if (isHandler(handler)) {
        const method = getMethod(key);
        if (method) {
          apiHandlers.push({
            handler,
            method,
            name,
          });
        } else {
          throw new Error(`Unknown HTTP Method: ${key}`);
        }
      }
    });
  });

  return apiHandlers;
};

export const getMethod = (name: string): HttpMethod | string => {
  const upperName = name.toUpperCase();

  switch (upperName) {
    case 'GET':
      return HttpMethod.GET;
    case 'POST':
      return HttpMethod.POST;
    case 'PUT':
      return HttpMethod.PUT;
    case 'DELETE':
    case 'DEL':
      return HttpMethod.DELETE;
    case 'CONNECT':
      return HttpMethod.CONNECT;
    case 'TRACE':
      return HttpMethod.TRACE;
    case 'PATCH':
      return HttpMethod.PATCH;
    case 'OPTION':
      return HttpMethod.OPTION;
    // 兼容之前的方案，默认导出是 GET
    case 'DEFAULT': {
      return HttpMethod.GET;
    }
    default:
      return upperName;
  }
};

export const getRouteName = (pwd: string, filename: string): string => {
  const relativeName = filename.substring(pwd.length);
  const relativePath = relativeName.split('.').slice(0, -1).join('.');

  const nameSplit = relativePath.split(path.sep).map(item => {
    if (item.length > 2) {
      if (item.startsWith('[') && item.endsWith(']')) {
        return `:${item.substring(1, item.length - 1)}`;
      }
    }

    return item;
  });

  const name = nameSplit.join('/');
  const finalName = name.endsWith(INDEX_SUFFIX)
    ? name.substring(0, name.length - INDEX_SUFFIX.length)
    : name;

  return clearRouteName(finalName);
};

const clearRouteName = (routeName: string): string => {
  let finalRouteName = routeName.trim();

  if (!finalRouteName.startsWith('/')) {
    finalRouteName = `/${finalRouteName}`;
  }

  if (finalRouteName.length > 1 && finalRouteName.endsWith('/')) {
    finalRouteName = finalRouteName.substring(0, finalRouteName.length - 1);
  }

  return finalRouteName;
};

const requireModule = (filename: string): Record<string, any> => {
  const module = require(filename);

  if (isFunction(module)) {
    return { default: module };
  }

  return module;
};

const isFunction = (input: any): input is (...args: any[]) => any =>
  input && {}.toString.call(input) === '[object Function]';
