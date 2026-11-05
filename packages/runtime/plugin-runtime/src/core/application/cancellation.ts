import { createRuntimeSyncHook } from '@modern-js/plugin/runtime';
import type { ApplicationPreparation, RuntimePlugin } from '../plugin/types';

/** Preparation cancellation is an adapter capability, not ordinary CSR state. */
export function cancellationPlugin(
  signal?: AbortSignal,
  onError: (error: unknown) => void = console.error,
): RuntimePlugin {
  return {
    name: '@modern-js/runtime-preparation-cancellation',
    post: ['@modern-js/runtime-plugin-request-context'],
    registryHooks: () => ({
      wrapPreparation:
        createRuntimeSyncHook<
          (prepare: ApplicationPreparation) => ApplicationPreparation
        >(),
    }),
    setup(api) {
      signal?.throwIfAborted();
      let cancel: ((reason: unknown) => void) | undefined;
      const abort = () => {
        try {
          api.getRuntimeContext()._internalContext.dispose();
        } catch (error) {
          onError(error);
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
    },
  };
}
