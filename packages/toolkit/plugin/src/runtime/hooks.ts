import {
  createAsyncInterruptHook,
  createCollectSyncHook,
  createSyncHook,
} from '../hooks';
import type {
  ConfigFn,
  Hooks,
  OnBeforeRenderFn,
  PickContextFn,
  WrapRootFn,
} from '../types/runtime/hooks';

export function initHooks<RuntimeConfig, RuntimeContext>(): Hooks<
  RuntimeConfig,
  RuntimeContext
> {
  return {
    onBeforeRender:
      createAsyncInterruptHook<OnBeforeRenderFn<RuntimeContext>>(),
    wrapRoot: createSyncHook<WrapRootFn>(),
    pickContext: createSyncHook<PickContextFn<RuntimeContext>>(),
    config: createCollectSyncHook<ConfigFn<RuntimeConfig>>(),
  };
}
