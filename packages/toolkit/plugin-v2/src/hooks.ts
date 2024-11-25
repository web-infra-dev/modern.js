import type { AsyncHook, CollectAsyncHook } from './types/hooks';
import type { UnwrapPromise } from './types/utils';

export function createAsyncHook<
  Callback extends (...args: any[]) => any,
>(): AsyncHook<Callback> {
  const callbacks: Callback[] = [];

  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = async (...params: Parameters<Callback>) => {
    for (const callback of callbacks) {
      const result = await callback(...params);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return params[0] || [];
  };

  return {
    tap,
    call,
  };
}

export function createCollectAsyncHook<
  Callback extends (...params: any[]) => any,
>(): CollectAsyncHook<Callback> {
  const callbacks: Callback[] = [];

  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = async (...params: Parameters<Callback>) => {
    const results: UnwrapPromise<ReturnType<Callback>>[] = [];
    for (const callback of callbacks) {
      const result = await callback(params);

      if (result !== undefined) {
        results.push(result);
      }
    }

    return results;
  };

  return {
    tap,
    call,
  };
}
