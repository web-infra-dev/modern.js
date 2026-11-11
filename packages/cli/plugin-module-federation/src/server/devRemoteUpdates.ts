export interface DevRemoteUpdatesOptions<T> {
  remotes: readonly T[];
  shouldUpdateRemote: (
    remote: T,
    options: { signal: AbortSignal },
  ) => Promise<boolean>;
  updateRemotes: (remotes: T[]) => Promise<{ changed?: boolean } | void>;
  onReload: () => void;
  onError: (error: unknown) => void;
  intervalMs?: number;
  checkTimeoutMs?: number;
}

/** One background watcher per service, never one per request or application rebuild. */
export function startDevRemoteUpdates<T>(options: DevRemoteUpdatesOptions<T>) {
  const lifetime = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | undefined;
  let requested = false;

  const check = (): Promise<void> => {
    if (lifetime.signal.aborted) return Promise.resolve();
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (running) {
      requested = true;
      return running;
    }
    running = (async () => {
      do {
        requested = false;
        const timeout = new AbortController();
        const deadline = setTimeout(
          () => timeout.abort(new Error('Remote manifest check timed out')),
          options.checkTimeoutMs ?? 5000,
        );
        deadline.unref?.();
        const signal = AbortSignal.any([lifetime.signal, timeout.signal]);
        try {
          const checks = await Promise.allSettled(
            options.remotes.map(remote =>
              options.shouldUpdateRemote(remote, { signal }),
            ),
          );
          if (lifetime.signal.aborted) return;
          const changed: T[] = [];
          checks.forEach((result, index) => {
            if (result.status === 'rejected') options.onError(result.reason);
            else if (result.value) changed.push(options.remotes[index]);
          });
          if (changed.length) {
            const result = await options.updateRemotes(changed);
            if (!lifetime.signal.aborted && result?.changed !== false)
              options.onReload();
          }
        } catch (error) {
          if (!lifetime.signal.aborted) options.onError(error);
        } finally {
          clearTimeout(deadline);
        }
      } while (requested && !lifetime.signal.aborted);
    })().finally(() => {
      running = undefined;
      if (!lifetime.signal.aborted) {
        timer = setTimeout(() => void check(), options.intervalMs ?? 1000);
        timer.unref?.();
      }
    });
    return running;
  };

  void check();
  return {
    check,
    async close() {
      lifetime.abort();
      if (timer) clearTimeout(timer);
      await running;
    },
  };
}
