import { get, set } from '@modern-js/utils/lodash';

export const appendTo = (target: any, key: string, value: any) => {
  const v = get(target, key);
  if (Array.isArray(v)) {
    v.push(value);
  } else {
    set(target, key, [value]);
  }
};
