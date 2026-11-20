import { createRuntimeSyncHook } from '@modern-js/plugin/runtime';
import type { RuntimePluginAPI } from '@modern-js/plugin/runtime';
import type {
  ApplicationPreparation,
  RuntimeExtends,
  RuntimePlugin,
} from '../plugin/types';

export const preparationHooks = () => ({
  wrapPreparation:
    createRuntimeSyncHook<
      (prepare: ApplicationPreparation) => ApplicationPreparation
    >(),
});

/** An adapter owns cancellation, whether it renders a document or a fragment. */
export function initializeCancellation(
  api: RuntimePluginAPI<RuntimeExtends>,
  signal?: AbortSignal,
  onError?: (error: unknown) => void,
  work?: { track<T>(task: Promise<T>): Promise<T> },
) {
  signal?.throwIfAborted();
  let cancel: ((reason: unknown) => void) | undefined;
  const abort =
    signal &&
    (() => {
      try {
        api.getRuntimeContext()._internalContext.dispose(signal.reason);
      } catch (error) {
        (onError || console.error)(error);
      }
    });
  if (abort) signal!.addEventListener('abort', abort, { once: true });
  api.onDispose(reason => {
    if (abort) signal!.removeEventListener('abort', abort);
    cancel?.(
      reason ??
        signal?.reason ??
        new Error('Application instance has been disposed'),
    );
  });
  api.wrapPreparation!(prepare => () => {
    const cancelled = new Promise<never>((_, reject) => {
      cancel = reject;
    });
    const preparation = prepare();
    work?.track(preparation);
    return Promise.race([preparation, cancelled]).finally(() => {
      cancel = undefined;
    });
  });
}

export function cancellationPlugin(
  signal?: AbortSignal,
  onError?: (error: unknown) => void,
  work?: { track<T>(task: Promise<T>): Promise<T> },
): RuntimePlugin {
  return {
    name: '@modern-js/runtime-preparation-cancellation',
    registryHooks: preparationHooks,
    setup: api => initializeCancellation(api, signal, onError, work),
  };
}
