import { isObject, isString } from '@modern-js/utils/lodash';

interface ITem {
  [key: string]: string | ITem;
}

export function getObjKeyMap(obj: ITem, prefix = '') {
  const result: ITem = {};
  Object.keys(obj).forEach(key => {
    if (isString(obj[key])) {
      result[key] = prefix ? `${prefix}.${key}` : key;
    } else if (isObject(obj[key])) {
      result[key] = getObjKeyMap(
        obj[key] as ITem,
        prefix ? `${prefix}.${key}` : key,
      );
    }
  });
  return result;
}
