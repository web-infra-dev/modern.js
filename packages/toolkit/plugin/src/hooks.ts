import type {
  AsyncHook,
  AsyncInterruptHook,
  AsyncPipelineHook,
  CollectAsyncHook,
  CollectSyncHook,
  SyncHook,
  PluginHook,
} from './types/hooks';
import type { Tail, UnwrapPromise } from './types/utils';

// A global symbol keeps hook definitions clonable across the runtime and root
// package entries. Only static callbacks are copied into each runtime instance.
const hookFactory = Symbol.for('modern-js.plugin.hook-factory');

function withFactory<
  Callback extends (...args: any[]) => any,
  Hook extends PluginHook<Callback>,
>(hook: Hook, callbacks: Callback[], create: () => Hook): Hook {
  (hook as Hook & { [hookFactory]?: (this: Hook) => Hook })[hookFactory] =
    function (this: Hook) {
      // Object spreads and prototype wrappers can carry this private factory.
      // Their custom call/tap behavior cannot be cloned as a standard hook.
      if (this !== hook) return this;
      const instance = create();
      callbacks.forEach(callback => instance.tap(callback));
      return instance;
    };
  return hook;
}

export function cloneHook<Hook extends PluginHook<(...args: any[]) => any>>(
  hook: Hook,
): Hook {
  const create = (hook as Hook & { [hookFactory]?: (this: Hook) => Hook })[
    hookFactory
  ];
  return create ? create.call(hook) : hook;
}

export function createRuntimeAsyncInterruptHook<
  Callback extends (...args: any[]) => any,
>(
  shouldContinue: () => boolean = () => true,
  normalizeResult?: (
    value: any,
    current: any,
    interrupt: (value: any) => void,
  ) => any,
  callbacks: Callback[] = [],
): AsyncInterruptHook<Callback> {
  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const callWithResult = async (...params: Tail<Parameters<Callback>>) => {
    let interrupted = false;
    let interruptResult: any;

    const interrupt = (info: any) => {
      interrupted = true;
      interruptResult = info;
    };

    for (const callback of callbacks) {
      if (!shouldContinue()) interrupted = true;
      if (interrupted) break;
      const result = await callback(...params, interrupt);
      if (!shouldContinue()) {
        interrupted = true;
        break;
      }
      if (result !== undefined && !interrupted) {
        params[0] = normalizeResult
          ? normalizeResult(result, params[0], interrupt)
          : result;
      }
    }
    if (!shouldContinue()) interrupted = true;

    return {
      value: interrupted ? interruptResult : params[0] || [],
      interrupted,
    };
  };
  // Forward arguments without allocating a second parameter array in browser
  // targets that transpile rest parameters. The result API owns the arguments.
  const call: AsyncInterruptHook<Callback>['call'] = function () {
    return callWithResult
      .apply(undefined, arguments as unknown as Tail<Parameters<Callback>>)
      .then(result => result.value);
  };

  return { tap, call, callWithResult };
}

export function createRuntimeSyncHook<Callback extends (...args: any[]) => any>(
  callbacks: Callback[] = [],
): SyncHook<Callback> {
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

  return { tap, call };
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

  return withFactory({ tap, call }, callbacks, createAsyncHook<Callback>);
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
      const result = await callback(...params);

      if (result !== undefined) {
        results.push(result);
      }
    }

    return results;
  };

  return withFactory(
    { tap, call },
    callbacks,
    createCollectAsyncHook<Callback>,
  );
}

export function createRuntimeCollectSyncHook<
  Callback extends (...params: any[]) => any,
>(callbacks: Callback[] = []): CollectSyncHook<Callback> {
  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = (...params: Parameters<Callback>) => {
    const results: ReturnType<Callback>[] = [];
    for (const callback of callbacks) {
      const result = callback(...params);

      if (result !== undefined) {
        results.push(result);
      }
    }

    return results;
  };

  return { tap, call };
}

export function createAsyncPipelineHook<
  Callback extends (...args: any[]) => any,
>(): AsyncPipelineHook<Callback> {
  const callbacks: Callback[] = [];

  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = async (...params: Parameters<Callback>) => {
    for (const callback of callbacks) {
      let runNext = false;
      const next = (info: any) => {
        runNext = true;
        if (info) {
          params[0] = info;
        }
      };
      const result = await callback(...params, next);
      if (!runNext) {
        params[0] = result;
        break;
      }
    }

    return (params[0] as Promise<UnwrapPromise<ReturnType<Callback>>>) || [];
  };

  return withFactory(
    { tap, call },
    callbacks,
    createAsyncPipelineHook<Callback>,
  );
}

/** Static hook definitions carry cloning metadata. Runtime records do not. */
export function createSyncHook<
  Callback extends (...args: any[]) => any,
>(): SyncHook<Callback> {
  const callbacks: Callback[] = [];
  return withFactory(
    createRuntimeSyncHook(callbacks),
    callbacks,
    createSyncHook<Callback>,
  );
}
export function createCollectSyncHook<
  Callback extends (...args: any[]) => any,
>(): CollectSyncHook<Callback> {
  const callbacks: Callback[] = [];
  return withFactory(
    createRuntimeCollectSyncHook(callbacks),
    callbacks,
    createCollectSyncHook<Callback>,
  );
}
export function createAsyncInterruptHook<
  Callback extends (...args: any[]) => any,
>(
  shouldContinue?: () => boolean,
  normalizeResult?: (
    value: any,
    current: any,
    interrupt: (value: any) => void,
  ) => any,
): AsyncInterruptHook<Callback> {
  const callbacks: Callback[] = [];
  return withFactory(
    createRuntimeAsyncInterruptHook(shouldContinue, normalizeResult, callbacks),
    callbacks,
    () => createAsyncInterruptHook<Callback>(shouldContinue, normalizeResult),
  );
}
