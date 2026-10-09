import type {
  ApplicationDataPatch,
  ApplicationPendingValue,
  ApplicationSnapshotV2,
} from './types';

type Pending = {
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  settled: boolean;
};

/** All Promise state belongs to this application instance, never to window. */
export function restoreApplicationData(
  snapshot: ApplicationSnapshotV2,
  updates: ReadableStream<unknown>,
) {
  const values = new Map<string, Pending>();
  let stopped = false;
  const restore = (
    input: unknown,
    pending: ApplicationPendingValue[],
  ): unknown => {
    let value = input;
    for (const reference of pending) {
      let item = values.get(reference.id);
      if (!item) {
        let resolve!: Pending['resolve'];
        let reject!: Pending['reject'];
        const promise = new Promise((yes, no) => {
          resolve = yes;
          reject = no;
        });
        // React may not visit a deferred boundary until its HTML arrives.
        void promise.catch(() => {});
        item = { promise, resolve, reject, settled: false };
        values.set(reference.id, item);
      }
      if (!reference.path.length) {
        value = item.promise;
        continue;
      }
      let target = value as Record<string | number, unknown>;
      for (const key of reference.path.slice(0, -1)) {
        if (!target || !Object.prototype.hasOwnProperty.call(target, key)) {
          throw new Error('Invalid application deferred data path');
        }
        target = target[key] as typeof target;
      }
      const key = reference.path[reference.path.length - 1];
      if (!target || !Object.prototype.hasOwnProperty.call(target, key)) {
        throw new Error('Invalid application deferred data path');
      }
      Object.defineProperty(target, key, {
        value: item.promise,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return value;
  };
  // A snapshot can be used for multiple containers; never insert Promises into
  // the caller's serialized copy.
  let materialized: ApplicationSnapshotV2;
  try {
    materialized = restore(
      JSON.parse(JSON.stringify(snapshot)),
      snapshot.pending,
    ) as ApplicationSnapshotV2;
  } catch (error) {
    void updates.cancel(error).catch(() => {});
    throw error;
  }
  const reader = updates.getReader();
  const cancel = (
    reason: unknown = new Error('Application data was cancelled'),
  ) => {
    if (stopped) return;
    stopped = true;
    for (const item of values.values()) {
      if (!item.settled) {
        item.settled = true;
        item.reject(reason);
      }
    }
    void reader.cancel(reason).catch(() => {});
  };
  const done = (async () => {
    try {
      while (!stopped) {
        const next = await reader.read();
        if (next.done) break;
        const patch = next.value as ApplicationDataPatch;
        const item = values.get(patch?.id);
        if (!item || item.settled)
          throw new Error('Unknown or duplicate application data update');
        if (patch.status === 'fulfilled') {
          item.resolve(restore(patch.value, patch.pending));
        } else if (patch.status === 'rejected') {
          const error = new Error(patch.error.message);
          error.name = patch.error.name;
          if (patch.error.stack) error.stack = patch.error.stack;
          item.reject(error);
        } else {
          throw new Error('Unsupported application data update');
        }
        item.settled = true;
      }
      if (!stopped && [...values.values()].some(value => !value.settled)) {
        throw new Error(
          'Application data stream ended before all deferred values settled',
        );
      }
    } catch (error) {
      cancel(error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  })();
  void done.catch(() => {});
  return { snapshot: materialized, done, cancel };
}
