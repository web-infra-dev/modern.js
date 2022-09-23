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
