import type {
  SharedNormalizedConfig,
  BuilderTarget,
  SharedCompiledPkgNames,
} from './types';
import { join } from 'path';

export const createVirtualModule = (content: string) =>
  `data:text/javascript,${content}`;

export const removeLeadingSlash = (s: string): string => s.replace(/^\/+/, '');

export const addTrailingSlash = (s: string): string =>
  s.endsWith('/') ? s : `${s}/`;

export interface AwaitableGetter<T> extends PromiseLike<T[]> {
  promises: Promise<T>[];
}

/**
 * Make Awaitable.
 */
export const awaitableGetter = <T>(
  promises: Promise<T>[],
): AwaitableGetter<T> => {
  const then: PromiseLike<T[]>['then'] = (...args) =>
    Promise.all(promises).then(...args);
  return { then, promises };
};

export const isUseJsSourceMap = (config: SharedNormalizedConfig) => {
  const { disableSourceMap } = config.output || {};

  if (typeof disableSourceMap === 'boolean') {
    return !disableSourceMap;
  }

  return !disableSourceMap.js;
};

export const isUseCssSourceMap = (config: SharedNormalizedConfig) => {
  const { disableSourceMap } = config.output || {};

  if (typeof disableSourceMap === 'boolean') {
    return !disableSourceMap;
  }

  // If the disableSourceMap.css option is not specified, we will enable it in development mode.
  // We do not need CSS Source Map in production mode.
  if (disableSourceMap.css === undefined) {
    return process.env.NODE_ENV !== 'production';
  }

  return !disableSourceMap.css;
};

export const getSharedPkgCompiledPath = (
  packageName: SharedCompiledPkgNames,
) => {
  return join(__dirname, '../compiled', packageName);
};

// Determine if the string is a URL
export const isURL = (str: string) =>
  str.startsWith('http') || str.startsWith('//:');

export * as z from './zod';

export function isWebTarget(target: BuilderTarget | BuilderTarget[]) {
  return ['modern-web', 'web', 'web-worker'].some(t =>
    (Array.isArray(target) ? target : [target]).includes(t as BuilderTarget),
  );
}

export function resolvePackage(loader: string, dirname: string) {
  // Vitest do not support require.resolve to source file
  return process.env.VITEST
    ? loader
    : require.resolve(loader, { paths: [dirname] });
}
