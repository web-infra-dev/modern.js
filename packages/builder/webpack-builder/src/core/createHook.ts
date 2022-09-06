import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyBuilderConfigFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
  OnBeforeStartDevServerFn,
} from '../types';

export type AsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (
    ...args: Parameters<Callback>
  ) => Promise<Parameters<Callback>[number][]>;
};

export function createAsyncHook<Callback extends (...args: any[]) => any>() {
  const callbacks: Callback[] = [];

  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = async (...args: Parameters<Callback>) => {
    const params = args.slice(0) as Parameters<Callback>;

    for (const cb of callbacks) {
      const result = await cb(...params);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return params;
  };

  return {
    tap,
    call,
  };
}

export function initHooks() {
  return {
    onExitHook: createAsyncHook<OnExitFn>(),
    onAfterBuildHook: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn>(),
    modifyWebpackChainHook: createAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfigHook: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyBuilderConfigHook: createAsyncHook<ModifyBuilderConfigFn>(),
    onAfterCreateCompilerHooks: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompilerHooks: createAsyncHook<OnBeforeCreateCompilerFn>(),
    onBeforeStartDevServerHooks: createAsyncHook<OnBeforeStartDevServerFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
