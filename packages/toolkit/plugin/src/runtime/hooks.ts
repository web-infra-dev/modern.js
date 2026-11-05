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
  PickContextFn,
  StringSSRCollectorsInfo,
  WrapRootFn,
} from '../types/runtime/hooks';

export function initHooks<RuntimeConfig, RuntimeContext>(
  shouldContinue?: () => boolean,
  runtimeContext?: RuntimeContext,
): Hooks<RuntimeConfig, RuntimeContext> {
  return {
    onBeforeRender: createAsyncInterruptHook<OnBeforeRenderFn<RuntimeContext>>(
      shouldContinue,
      runtimeContext === undefined
        ? undefined
        : (value, _current, interrupt) => {
            if (typeof Response !== 'undefined' && value instanceof Response) {
              interrupt(value);
            } else if (
              value &&
              value !== runtimeContext &&
              typeof value === 'object'
            ) {
              const context = runtimeContext as Record<PropertyKey, unknown>;
              for (const key of Reflect.ownKeys(value)) {
                if (!Object.prototype.propertyIsEnumerable.call(value, key))
                  continue;
                // Returning {...context} must not rewrite unchanged readonly
                // capabilities such as the router's routes getter.
                if (
                  !Object.prototype.hasOwnProperty.call(context, key) ||
                  !Object.is(context[key], value[key])
                ) {
                  context[key] = value[key];
                }
              }
            }
            return runtimeContext;
          },
    ),
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
