// Private development transport. Ordinary manifest reads keep returning 503
// while the producer is compiling.
export const DEV_MANIFEST_WAIT_HEADER = 'x-modern-mf-dev-wait';
export const DEV_MANIFEST_WAIT_TIMEOUT = 30_000;

// Compatible with TypeScript DOM libs predating AbortSignal.any.
export function anyAbortSignal(signals: AbortSignal[]): AbortSignal {
  const nativeAny = (
    AbortSignal as typeof AbortSignal & {
      any?: (signals: AbortSignal[]) => AbortSignal;
    }
  ).any;
  if (nativeAny) return nativeAny.call(AbortSignal, signals);
  const controller = new AbortController();
  const abort = (signal: AbortSignal) => controller.abort(signal.reason);
  for (const signal of signals) {
    if (signal.aborted) {
      abort(signal);
      return controller.signal;
    }
    signal.addEventListener('abort', () => abort(signal), { once: true });
  }
  return controller.signal;
}
