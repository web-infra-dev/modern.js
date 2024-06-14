import type { Path } from './valtio';

export type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
export type PromiseReject = (reason?: any) => void;

export const isPromiseLike = <T = any>(obj: unknown): obj is PromiseLike<T> =>
  obj !== null &&
  typeof obj === 'object' &&
  typeof (obj as any).then === 'function';

const _promiseResolveMapping = new WeakMap<Promise<any>, PromiseResolve<any>>();
const _promiseRejectMapping = new WeakMap<Promise<any>, PromiseReject>();

export class PromiseStub<T> implements PromiseLike<T> {
  static create<T>(): PromiseStub<T> {
    const stub = new PromiseStub<T>();
    stub.promise = new Promise<T>((resolve, reject) => {
      stub.resolve = resolve;
      stub.reject = reject;
    });
    _promiseResolveMapping.set(stub.promise, stub.resolve);
    _promiseRejectMapping.set(stub.promise, stub.reject);
    return stub;
  }

  static get<T>(promise: Promise<T>) {
    const resolve = _promiseResolveMapping.get(promise);
    const reject = _promiseRejectMapping.get(promise);
    if (!resolve || !reject) {
      throw new Error('Invalid promise');
    }
    const stub = new PromiseStub<T>();
    stub.promise = promise;
    stub.resolve = resolve as PromiseResolve<T>;
    stub.reject = reject;
    return stub;
  }

  resolve!: PromiseResolve<T>;

  reject!: PromiseReject;

  promise!: Promise<T>;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }
}

export const traversePromises = (
  obj: any,
  path: Path = [],
): [PromiseLike<unknown>, Path][] => {
  const promises = new Set<[PromiseLike<unknown>, Path]>();
  const memo = new WeakSet();
  const traverse = (value: any, currentPath: Path) => {
    if (value === null) return;
    if (typeof value === 'object') {
      if (memo.has(value)) {
        return;
      } else {
        memo.add(value);
      }
    }
    if (isPromiseLike(value)) {
      promises.add([value, currentPath]);
    } else if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        traverse(v, [...currentPath, k]);
      }
    }
  };
  traverse(obj, path);
  return Array.from(promises.values());
};

export const applySettled = <T = unknown>(promise: PromiseLike<T>) => {
  const settled: { resolved?: unknown; rejected?: unknown } = {};
  promise.then(value => {
    settled.resolved = value;
  });
  if ('catch' in promise && typeof promise.catch === 'function') {
    promise.catch((err: unknown) => {
      settled.rejected = err;
    });
  }
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    await Promise.resolve();
    if ('rejected' in settled) {
      reject(settled.rejected);
    } else if ('resolved' in settled) {
      resolve(settled.resolved);
    }
  });
};

export interface PromiseResolvers<T> {
  resolve: PromiseResolve<T>;
  reject: PromiseReject;
  promise: Promise<T>;
}

type Primitive = string | number | boolean | null | undefined | symbol | bigint;
type DeepToResolversIgnore =
  | Date
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>
  | Error
  | RegExp
  | ((...args: any[]) => any)
  | Primitive;
export type DeepToResolvers<T> = T extends DeepToResolversIgnore
  ? T
  : T extends Promise<unknown>
  ? PromiseResolvers<Awaited<T>>
  : T extends object
  ? { [K in keyof T]: DeepToResolvers<T[K]> }
  : T;

export const withResolvers = <T>() => {
  const resolvers = {} as PromiseResolvers<T>;
  resolvers.promise = new Promise((resolve, reject) => {
    resolvers.resolve = resolve;
    resolvers.reject = reject;
  });
  return resolvers;
};
