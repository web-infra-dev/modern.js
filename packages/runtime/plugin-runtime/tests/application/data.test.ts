import { restoreApplicationData } from '../../src/application/data';
import { createApplicationData } from '../../src/application/data.server';
import type {
  ApplicationDataPatch,
  ApplicationSnapshotV2,
} from '../../src/application/types';

const snapshot = (value: unknown): Omit<ApplicationSnapshotV2, 'pending'> => ({
  protocol: 'modern-application/2',
  reactVersion: '19.2.8',
  identifierPrefix: 'test-',
  shellMarker: 'test-shell',
  url: 'http://example/',
  basename: '/',
  props: { value },
});
const deferred = () => {
  let resolve!: (value: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

it('restores nested deferred values without colliding with user data', async () => {
  const first = deferred();
  const nested = deferred();
  const encoded = createApplicationData(
    snapshot({
      first: first.promise,
      again: first.promise,
      literal: { id: '0', status: 'fulfilled' },
    }),
  );
  const restored = restoreApplicationData(encoded.snapshot, encoded.updates);
  const value = restored.snapshot.props.value as any;
  expect(value.first).toBe(value.again);
  expect(value.literal).toEqual({ id: '0', status: 'fulfilled' });
  first.resolve({ nested: [nested.promise] });
  const result = await value.first;
  expect(result.nested[0]).toBeInstanceOf(Promise);
  nested.resolve('second-value');
  expect(await result.nested[0]).toBe('second-value');
  await restored.done;
  expect((encoded.snapshot.props.value as any).first).toBeNull();
});

it('keeps identical deferred IDs separate in simultaneous application instances', async () => {
  const a = deferred();
  const b = deferred();
  const first = createApplicationData(snapshot(a.promise));
  const second = createApplicationData(snapshot(b.promise));
  expect(first.snapshot.pending[0].id).toBe(second.snapshot.pending[0].id);
  const left = restoreApplicationData(first.snapshot, first.updates);
  const right = restoreApplicationData(second.snapshot, second.updates);
  b.resolve('inventory');
  expect(await right.snapshot.props.value).toBe('inventory');
  a.resolve('products');
  expect(await left.snapshot.props.value).toBe('products');
  await Promise.all([left.done, right.done]);
});

it('restores rejection as a real Error without failing the data transport', async () => {
  const source = deferred();
  const encoded = createApplicationData(snapshot(source.promise));
  const restored = restoreApplicationData(encoded.snapshot, encoded.updates);
  source.reject(new TypeError('missing stock'));
  await expect(restored.snapshot.props.value).rejects.toThrow('missing stock');
  await restored.done;
});

it('rejects unresolved values if the transport ends early', async () => {
  const initial: ApplicationSnapshotV2 = {
    ...snapshot(null),
    pending: [{ id: '0', path: ['props', 'value'] }],
  };
  const restored = restoreApplicationData(
    initial,
    new ReadableStream({
      start(controller) {
        controller.close();
      },
    }),
  );
  await expect(restored.done).rejects.toThrow(
    'ended before all deferred values settled',
  );
  await expect(restored.snapshot.props.value).rejects.toThrow(
    'ended before all deferred values settled',
  );
});

it('cancels the reader and rejects pending values on application destroy', async () => {
  let reason: unknown;
  const initial: ApplicationSnapshotV2 = {
    ...snapshot(null),
    pending: [{ id: '0', path: ['props', 'value'] }],
  };
  const restored = restoreApplicationData(
    initial,
    new ReadableStream({
      cancel(error) {
        reason = error;
      },
    }),
  );
  restored.cancel(new Error('unmounted'));
  await expect(restored.snapshot.props.value).rejects.toThrow('unmounted');
  await restored.done;
  expect(reason).toBeInstanceOf(Error);
});

it('does not mutate object prototypes when restoring a serialized own property', async () => {
  const initial = JSON.parse(
    JSON.stringify({
      ...snapshot(null),
      pending: [{ id: '0', path: ['props', '__proto__'] }],
    }),
  );
  Object.defineProperty(initial.props, '__proto__', {
    value: null,
    enumerable: true,
  });
  const restored = restoreApplicationData(
    initial,
    new ReadableStream<ApplicationDataPatch>({
      start(controller) {
        controller.enqueue({
          id: '0',
          status: 'fulfilled',
          value: 'safe',
          pending: [],
        });
        controller.close();
      },
    }),
  );
  expect(await restored.snapshot.props.__proto__).toBe('safe');
  expect(Object.getPrototypeOf(restored.snapshot.props)).toBe(Object.prototype);
  await restored.done;
});

it('cancels malformed initial data without leaving the transport locked', () => {
  let cancelled = false;
  const updates = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  const initial: ApplicationSnapshotV2 = {
    ...snapshot(null),
    pending: [{ id: '0', path: ['props', 'missing'] }],
  };
  expect(() => restoreApplicationData(initial, updates)).toThrow(
    'Invalid application deferred data path',
  );
  expect(cancelled).toBe(true);
  expect(updates.locked).toBe(false);
});
