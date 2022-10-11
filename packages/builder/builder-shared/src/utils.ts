import assert from 'assert';
import _ from '@modern-js/utils/lodash';
import onChange from 'on-change';

export function deepFreezed<T extends Record<any, any> | any[]>(obj: T): T {
  assert(typeof obj === 'object');
  const handle = (item: any) =>
    typeof item === 'object' ? deepFreezed(item) : item;
  const ret = (
    Array.isArray(obj) ? _.map(obj, handle) : _.mapValues(obj, handle)
  ) as T;
  return Object.freeze(ret);
}

export function deepProtected<T extends Record<any, any> | any[]>(
  obj: T,
  silent?: boolean,
): T {
  assert(typeof obj === 'object');
  if (silent) {
    return deepFreezed(obj);
  } else {
    return onChange(obj, () => {
      throw new Error('Cannot modify protected object');
    });
  }
}
