import { isPromiseLike, PromiseStub } from './promise';

export function replacer() {
  const memo = new WeakSet();
  return (_key: string, value: any): any => {
    if (typeof value === 'object' && value !== null) {
      if (memo.has(value)) {
        return undefined;
      }
      memo.add(value);
    }
    if (isPromiseLike(value)) {
      return { __type__: 'promise' };
    }
    return value;
  };
}

export function reviver() {
  const memo = new WeakSet();
  return (_key: string, value: any): any => {
    if (typeof value === 'object' && value !== null) {
      if (memo.has(value)) {
        return undefined;
      }
      memo.add(value);
    }
    if (!value || typeof value !== 'object') {
      return value;
    }
    if (value.__type__ === 'promise' && Object.keys(value).length === 1) {
      return PromiseStub.create().promise;
    }
    return value;
  };
}
