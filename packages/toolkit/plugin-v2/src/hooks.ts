import type {
  AsyncHook,
  AsyncInterruptHook,
  CollectAsyncHook,
  CollectSyncHook,
  SyncHook,
} from './types/hooks';
import type { Tail, UnwrapPromise } from './types/utils';

export function createAsyncInterruptHook<
  Callback extends (...args: any[]) => any,
>(): AsyncInterruptHook<Callback> {
  const callbacks: Callback[] = [];

  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = async (...params: Tail<Parameters<Callback>>) => {
    let interrupted = false;
    let interruptResult: any;

    const interrupt = (info: any) => {
      interrupted = true;
      interruptResult = info;
    };

    for (const callback of callbacks) {
      if (interrupted) break;
      const result = await callback(...params, interrupt);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return interrupted ? interruptResult : params[0] || [];
  };

  return {
    tap,
    call,
  };
}

export function createSyncHook<
  Callback extends (...args: any[]) => any,
>(): SyncHook<Callback> {
  const callbacks: Callback[] = [];

  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = (...params: Parameters<Callback>) => {
    for (const callback of callbacks) {
      const result = callback(...params);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return params[0];
  };

  return {
    tap,
    call,
  };
}

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

export function createCollectSyncHook<
  Callback extends (...params: any[]) => any,
>(): CollectSyncHook<Callback> {
  const callbacks: Callback[] = [];

  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = (...params: Parameters<Callback>) => {
    const results: ReturnType<Callback>[] = [];
    for (const callback of callbacks) {
      const result = callback(params);

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
