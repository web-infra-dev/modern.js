import assert from 'assert';
import _ from '@modern-js/utils/lodash';
import { BuilderOptions } from './types/builder';

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

export function applyDefaultBuilderOptions(options?: BuilderOptions) {
  return {
    cwd: process.cwd(),
    entry: {},
    target: ['web'],
    configPath: null,
    framework: 'modern-js',
    ...options,
  } as Required<BuilderOptions>;
}

export const mergeBuilderConfig = <T>(config: T, ...sources: T[]): T =>
  _.mergeWith(config, ...sources, (target: unknown, source: unknown) => {
    const pair = [target, source];
    if (pair.some(_.isUndefined)) {
      // fallback to lodash default merge behavior
      return undefined;
    }
    if (pair.some(_.isArray)) {
      return [..._.castArray(target), ..._.castArray(source)];
    }
    // convert function to chained function
    if (pair.some(_.isFunction)) {
      return [target, source];
    }
    // fallback to lodash default merge behavior
    return undefined;
  });
