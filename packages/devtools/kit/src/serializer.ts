import { isPromiseLike, PromiseStub } from './promise';

export function replacer(this: any, _key: string, value: any): any {
  if (isPromiseLike(value)) {
    return { __type__: 'promise' };
  }
  return value;
}

export function reviver(this: any, _key: string, value: any): any {
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (value.__type__ === 'promise' && Object.keys(value).length === 1) {
    return PromiseStub.create().promise;
  }
  return value;
}
