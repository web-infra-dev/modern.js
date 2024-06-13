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

const _thrownPromiseMap = new WeakMap<Promise<any>, any>();

export const use = <T>(value: T): Awaited<T> => {
  if (value instanceof Promise) {
    if (_thrownPromiseMap.has(value)) {
      const _value = _thrownPromiseMap.get(value);
      if (_value instanceof Error) {
        throw _value;
      } else if (_value instanceof Promise) {
        throw _value;
      } else {
        return _value;
      }
    } else {
      _thrownPromiseMap.set(value, value);
      value
        .then(v => _thrownPromiseMap.set(value, v))
        .catch(e => _thrownPromiseMap.set(value, e));
      throw value;
    }
  } else {
    return value as any;
  }
};

export const useStore = <T extends object>(proxy: T) => {
  const _proxy = use(proxy);
  return [useSnapshot(_proxy), _proxy] as const;
};
