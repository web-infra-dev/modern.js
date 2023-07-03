import path from 'path';
import { globby } from '@modern-js/utils';
import { INDEX_SUFFIX } from './constants';
import { APIHandlerInfo } from './types';

type MaybeAsync<I> = I | Promise<I>;
export type NormalHandler = (...args: any[]) => any;
export type Handler<I, O> = (input: I) => MaybeAsync<O>;

export const getFiles = (
  lambdaDir: string,
  rules: string | string[],
): string[] =>
  globby
    .sync(rules, {
      cwd: lambdaDir,
      gitignore: true,
    } as any)
    .map(file => path.resolve(lambdaDir, file as any));

export const getPathFromFilename = (
  baseDir: string,
  filename: string,
): string => {
  const relativeName = filename.substring(baseDir.length);
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

export const isHandler = (input: any): input is Handler<any, any> =>
  input && typeof input === 'function';

const isFunction = (input: any): input is (...args: any) => any =>
  input && {}.toString.call(input) === '[object Function]';

export const requireHandlerModule = (modulePath: string) => {
  // 测试环境不走缓存，因为缓存的 handler 文件，会被 mockAPI 函数进行 mock，升级 jest28，setupFilesAfterEnv 能做异步操作的话，可解此问题
  const originRequire =
    process.env.NODE_ENV === 'test' ? jest.requireActual : require;

  const module = originRequire(modulePath);
  if (isFunction(module)) {
    return { default: module };
  }
  return module;
};

const routeValue = (routePath: string) => {
  if (routePath.includes(':')) {
    return 11;
  }
  return 1;
};

export const sortRoutes = (apiHandlers: APIHandlerInfo[]) => {
  return apiHandlers.sort((handlerA, handlerB) => {
    return routeValue(handlerA.routeName) - routeValue(handlerB.routeName);
  });
};
