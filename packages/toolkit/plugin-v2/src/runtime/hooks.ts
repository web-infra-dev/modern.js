import { createAsyncHook } from '../hooks';
import type {
  ModifyRuntimeConfigFn,
  OnBeforeRenderFn,
  PickContextFn,
  WrapRootFn,
} from '../types/runtime/hooks';

export function initHooks<RuntimeConfig, RuntimeContext>() {
  return {
    onBeforeRender: createAsyncHook<OnBeforeRenderFn<RuntimeContext>>(),
    wrapRoot: createAsyncHook<WrapRootFn>(),
    pickContext: createAsyncHook<PickContextFn<RuntimeContext>>(),
    modifyRuntimeConfig:
      createAsyncHook<ModifyRuntimeConfigFn<RuntimeConfig>>(),
  };
}

export type Hooks<RuntimeConfig, RuntimeContext> = ReturnType<
  typeof initHooks<RuntimeConfig, RuntimeContext>
>;
