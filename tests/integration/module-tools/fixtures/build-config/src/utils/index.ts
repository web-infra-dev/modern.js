import { mergeWith } from 'lodash';

export const mergeFn = (...rest: any[]) => {
  return mergeWith(rest);
};
