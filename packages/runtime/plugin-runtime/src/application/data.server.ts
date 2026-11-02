import type {
  ApplicationDataPatch,
  ApplicationPendingValue,
  ApplicationSnapshotV2,
} from './types';

/** Encode pending values separately instead of waiting for every loader. */
export function createApplicationData(
  value: Omit<ApplicationSnapshotV2, 'pending'>,
) {
  let controller!: ReadableStreamDefaultController<ApplicationDataPatch>;
  let active = 0;
  let nextId = 0;
  let closed = false;
  const updates = new ReadableStream<ApplicationDataPatch>({
    start(value) {
      controller = value;
    },
    cancel() {
      closed = true;
    },
  });
  const fail = (error: unknown) => {
    if (closed) return;
    closed = true;
    controller.error(error);
  };
  const finish = () => {
    if (!closed && active === 0) {
      closed = true;
      controller.close();
    }
  };
  const promises = new WeakMap<object, string>();
  const encode = (
    input: unknown,
    path: Array<string | number>,
    pending: ApplicationPendingValue[],
    ancestors = new Set<object>(),
  ): unknown => {
    if (input && typeof (input as PromiseLike<unknown>).then === 'function') {
      const promise = input as PromiseLike<unknown>;
      // Each occurrence has its own reference. The same Promise may occur in
      // more than one snapshot field, but only needs one settlement message.
      let id = promises.get(promise as object);
      if (!id) {
        id = String(nextId++);
        promises.set(promise as object, id);
        active++;
        const promiseId = id;
        void Promise.resolve(promise).then(
          result => {
            if (closed) return;
            try {
              const pending: ApplicationPendingValue[] = [];
              const encoded = encode(result, [], pending);
              controller.enqueue(
                JSON.parse(
                  JSON.stringify({
                    id: promiseId,
                    status: 'fulfilled',
                    value: encoded,
                    pending,
                  }),
                ),
              );
              active--;
              finish();
            } catch (error) {
              fail(error);
            }
          },
          reason => {
            if (closed) return;
            const error =
              reason instanceof Error ? reason : new Error(String(reason));
            controller.enqueue({
              id: promiseId,
              status: 'rejected',
              error: {
                name: error.name,
                message: error.message,
                ...(process.env.NODE_ENV !== 'production'
                  ? { stack: error.stack }
                  : {}),
              },
            });
            active--;
            finish();
          },
        );
      }
      pending.push({ id, path });
      return null;
    }
    if (input instanceof Date) return input.toJSON();
    if (!input || typeof input !== 'object') return input;
    if (ancestors.has(input))
      throw new Error('Application data contains a circular reference');
    const nested = new Set(ancestors).add(input);
    if (Array.isArray(input)) {
      return input.map((item, index) =>
        encode(item, [...path, index], pending, nested),
      );
    }
    return Object.fromEntries(
      Object.entries(input).map(([key, item]) => [
        key,
        encode(item, [...path, key], pending, nested),
      ]),
    );
  };
  try {
    const pending: ApplicationPendingValue[] = [];
    const encoded = encode(value, [], pending) as Omit<
      ApplicationSnapshotV2,
      'pending'
    >;
    const snapshot: ApplicationSnapshotV2 = JSON.parse(
      JSON.stringify({ ...encoded, pending }),
    );
    finish();
    return { snapshot, updates, cancel: fail };
  } catch (error) {
    fail(error);
    // No caller exists to consume a stream if encoding itself throws.
    void updates.cancel().catch(() => {});
    throw error;
  }
}
