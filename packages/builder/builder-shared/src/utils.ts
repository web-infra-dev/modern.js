<<<<<<< HEAD
import _ from '@modern-js/utils/lodash';

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
=======
import assert from 'assert';
import _ from '@modern-js/utils/lodash';
import { CreateBuilderOptions } from './types/builder';

export function pick<T, U extends keyof T>(obj: T, keys: ReadonlyArray<U>) {
  return keys.reduce((ret, key) => {
    if (obj[key] !== undefined) {
      ret[key] = obj[key];
    }
    return ret;
  }, {} as Pick<T, U>);
}

export function deepFreezed<T extends Record<any, any> | any[]>(obj: T): T {
  assert(typeof obj === 'object');
  const handle = (item: any) =>
    typeof item === 'object' ? deepFreezed(item) : item;
  const ret = (
    Array.isArray(obj) ? _.map(obj, handle) : _.mapValues(obj, handle)
  ) as T;
  return Object.freeze(ret);
}

export function applyDefaultBuilderOptions(options?: CreateBuilderOptions) {
  return {
    cwd: process.cwd(),
    entry: {},
    target: ['web'],
    configPath: null,
    framework: 'modern-js',
    ...options,
  } as Required<CreateBuilderOptions>;
}
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
