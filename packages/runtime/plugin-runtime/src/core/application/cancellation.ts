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
) {
  signal?.throwIfAborted();
  let cancel: ((reason: unknown) => void) | undefined;
  const abort = () => {
    try {
      api.getRuntimeContext()._internalContext.dispose();
    } catch (error) {
      (onError || console.error)(error);
    }
  };
  signal?.addEventListener('abort', abort, { once: true });
  api.onDispose(() => {
    signal?.removeEventListener('abort', abort);
    cancel?.(
      signal?.reason || new Error('Application instance has been disposed'),
    );
  });
  api.wrapPreparation!(prepare => () => {
    const cancelled = new Promise<never>((_, reject) => {
      cancel = reject;
    });
    return Promise.race([prepare(), cancelled]).finally(() => {
      cancel = undefined;
    });
  });
}

export function cancellationPlugin(
  signal?: AbortSignal,
  onError?: (error: unknown) => void,
): RuntimePlugin {
  return {
    name: '@modern-js/runtime-preparation-cancellation',
    post: ['@modern-js/runtime-plugin-request-context'],
    registryHooks: preparationHooks,
    setup: api => initializeCancellation(api, signal, onError),
  };
}
