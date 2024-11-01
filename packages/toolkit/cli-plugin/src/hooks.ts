import type {
  ModifyBundlerChainFn,
  ModifyRsbuildConfigFn,
  ModifyRspackConfigFn,
  ModifyWebpackChainFn,
  // ModifyWebpackConfigFn,
} from '@rsbuild/core';

export type AsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};

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

    return params;
  };

  return {
    tap,
    call,
  };
}

export function initHooks(): {
  /** The following hooks are global hooks */
  modifyRspackConfig: AsyncHook<ModifyRspackConfigFn>;
  modifyBundlerChain: AsyncHook<ModifyBundlerChainFn>;
  modifyWebpackChain: AsyncHook<ModifyWebpackChainFn>;
  // modifyWebpackConfig: AsyncHook<ModifyWebpackConfigFn>;
  modifyRsbuildConfig: AsyncHook<ModifyRsbuildConfigFn>;
} {
  return {
    modifyRspackConfig: createAsyncHook<ModifyRspackConfigFn>(),
    modifyBundlerChain: createAsyncHook<ModifyBundlerChainFn>(),
    modifyWebpackChain: createAsyncHook<ModifyWebpackChainFn>(),
    // modifyWebpackConfig: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyRsbuildConfig: createAsyncHook<ModifyRsbuildConfigFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
