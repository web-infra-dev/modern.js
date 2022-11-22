import _ from '@modern-js/utils/lodash';
import {
  CSS_MODULES_REGEX,
  GLOBAL_CSS_REGEX,
  NODE_MODULES_REGEX,
} from './constants';

export function deepFreezed<T>(obj: T): T {
  if (!_.isObject(obj) || _.isNull(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    obj.forEach(deepFreezed);
  } else {
    Object.values(obj).forEach(deepFreezed);
  }
  return Object.freeze(obj);
}

export const extendsType =
  <T>() =>
  <P extends T>(source: P): P =>
    source;

export const createVirtualModule = (content: string) =>
  `data:text/javascript,${content}`;

export const removeLeadingSlash = (s: string): string => s.replace(/^\/+/, '');

export const addTrailingSlash = (s: string): string =>
  s.endsWith('/') ? s : `${s}/`;

/** Determine if a file path is a CSS module when disableCssModuleExtension is enabled. */
export const isLooseCssModules = (path: string) => {
  if (NODE_MODULES_REGEX.test(path)) {
    return CSS_MODULES_REGEX.test(path);
  }
  return !GLOBAL_CSS_REGEX.test(path);
};

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
