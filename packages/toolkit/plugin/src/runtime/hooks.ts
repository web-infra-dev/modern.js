import {
  createAsyncInterruptHook,
  createCollectSyncHook,
  createSyncHook,
} from '../hooks';
import type {
  ConfigFn,
  ExtendStreamSSRFn,
  ExtendStringSSRCollectorsFn,
  Hooks,
  OnBeforeRenderFn,
  OnHydrationFn,
  PickContextFn,
  StringSSRCollectorsInfo,
  WrapRootFn,
} from '../types/runtime/hooks';

export function initHooks<RuntimeConfig, RuntimeContext>(): Hooks<
  RuntimeConfig,
  RuntimeContext
> {
  return {
    onBeforeRender:
      createAsyncInterruptHook<OnBeforeRenderFn<RuntimeContext>>(),
    onHydration: createSyncHook<OnHydrationFn<RuntimeContext>>(),
    wrapRoot: createSyncHook<WrapRootFn>(),
    pickContext: createSyncHook<PickContextFn<RuntimeContext>>(),
    config: createCollectSyncHook<ConfigFn<RuntimeConfig>>(),
    extendStringSSRCollectors:
      createCollectSyncHook<
        ExtendStringSSRCollectorsFn<StringSSRCollectorsInfo>
      >(),
    extendStreamSSR: createCollectSyncHook<ExtendStreamSSRFn>(),
  };
}
