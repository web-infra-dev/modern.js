import _ from 'lodash';
import React, { useMemo } from 'react';
import { proxy, useSnapshot } from 'valtio';

export const useProxyFrom = <T extends object>(initializer: () => T) => {
  return useMemo(() => proxy(initializer()), []);
};

export const useStoreMap = <T extends object, P extends keyof T>(
  arr: T[],
  keyProp?: P,
): [React.Key, T][] => {
  const prop = keyProp ?? 'key';
  const pairs = useSnapshot(arr).map(i => {
    const key = (i as any)[prop];
    if (_.isString(key) || _.isNumber(key)) {
      return [key, proxy(i)] as [React.Key, T];
    } else {
      throw new TypeError(`Can't found correct key field.`);
    }
  });
  return pairs;
};
