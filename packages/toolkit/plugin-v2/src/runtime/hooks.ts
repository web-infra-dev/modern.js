import {
  createAsyncHook,
  createAsyncInterruptHook,
  createCollectSyncHook,
  createSyncHook,
} from '../hooks';
import type {
  ModifyRuntimeConfigFn,
  OnBeforeRenderFn,
  PickContextFn,
  WrapRootFn,
} from '../types/runtime/hooks';

export function initHooks<RuntimeConfig, RuntimeContext>() {
  return {
    onBeforeRender:
      createAsyncInterruptHook<OnBeforeRenderFn<RuntimeContext>>(),
    wrapRoot: createSyncHook<WrapRootFn>(),
    pickContext: createAsyncHook<PickContextFn<RuntimeContext>>(),
    modifyRuntimeConfig:
      createCollectSyncHook<ModifyRuntimeConfigFn<RuntimeConfig>>(),
  };
}

export type Hooks<RuntimeConfig, RuntimeContext> = ReturnType<
  typeof initHooks<RuntimeConfig, RuntimeContext>
>;
