import { isFunction } from '@modern-js/utils/lodash';
import type {
  ModifyBundlerChainFn,
  ModifyRsbuildConfigFn,
  ModifyRspackConfigFn,
  ModifyWebpackChainFn,
  // ModifyWebpackConfigFn,
} from '@rsbuild/core';
import type { HookDescriptor } from './types/plugin';

export type AsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback | HookDescriptor<Callback>) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};

export function createAsyncHook<
  Callback extends (...args: any[]) => any,
>(): AsyncHook<Callback> {
  const preGroup: Callback[] = [];
  const postGroup: Callback[] = [];
  const defaultGroup: Callback[] = [];

  const tap = (cb: Callback | HookDescriptor<Callback>) => {
    if (isFunction(cb)) {
      defaultGroup.push(cb);
    } else if (cb.order === 'pre') {
      preGroup.push(cb.handler);
    } else if (cb.order === 'post') {
      postGroup.push(cb.handler);
    } else {
      defaultGroup.push(cb.handler);
    }
  };

  const call = async (...params: Parameters<Callback>) => {
    const callbacks = [...preGroup, ...defaultGroup, ...postGroup];

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
