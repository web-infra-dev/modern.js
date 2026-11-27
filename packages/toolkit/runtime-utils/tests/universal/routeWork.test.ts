import { rstest } from '@rstest/core';
import React from 'react';
beforeEach(() => {
  rstest.stubGlobal('React', React);
});
afterEach(() => {
  rstest.unstubAllGlobals();
});
import type { DeferredData } from '../../src/browser/deferreds';
import { transformNestedRoutes } from '../../src/browser/nestedRoutes';
import { storage } from '../../src/universal/async_storage.server';

rstest.mock('../../src/universal/async_storage', () => ({
  getAsyncLocalStorage: async () => storage,
}));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}
function scope() {
  const pending = new Set<Promise<unknown>>();
  const work = {
    track<T>(promise: Promise<T>) {
      pending.add(promise);
      void promise.then(
        () => pending.delete(promise),
        () => pending.delete(promise),
      );
      return promise;
    },
  };
  return {
    pending,
    context: { work, activeDeferreds: new Map<string, DeferredData>() },
  };
}
function loader(route: Record<string, unknown>) {
  return transformNestedRoutes([{ id: 'route', path: '/', ...route } as any])[0]
    .loader as (args: any) => Promise<unknown>;
}

it('tracks route preloading even without a data loader', async () => {
  const imported = deferred<unknown>();
  const { pending, context } = scope();
  await storage.run(context, () =>
    loader({ lazyImport: () => imported.promise })({}),
  );
  expect(pending.has(imported.promise)).toBe(true);
  imported.resolve({});
  await imported.promise;
  expect(pending.size).toBe(0);
});

it('tracks the original deferred value after its cancellation wrapper rejects', async () => {
  const value = deferred<string>();
  const { pending, context } = scope();
  await storage.run(context, () =>
    loader({ loader: async () => ({ value: value.promise }) })({}),
  );
  context.activeDeferreds.get('route')!.cancel();
  await new Promise(resolve => setImmediate(resolve));
  expect(pending.size).toBeGreaterThan(0);
  value.resolve('done');
  await new Promise(resolve => setImmediate(resolve));
  expect(pending.size).toBe(0);
});

it('a rejected loader does not release its unfinished route import', async () => {
  const imported = deferred<unknown>();
  const { pending, context } = scope();
  await expect(
    storage.run(context, () =>
      loader({
        lazyImport: () => imported.promise,
        loader: async () => {
          throw new Error('loader failed');
        },
      })({}),
    ),
  ).rejects.toThrow('loader failed');
  expect(pending.has(imported.promise)).toBe(true);
  imported.resolve({});
  await imported.promise;
  expect(pending.size).toBe(0);
});

it('rejects a late route task before starting business code', async () => {
  const preload = rstest.fn();
  const data = rstest.fn();
  const context = {
    activeDeferreds: new Map(),
    work: {
      track() {
        throw new Error('request completed');
      },
    },
  };
  await expect(
    storage.run(context, () =>
      loader({ lazyImport: preload, loader: data })({}),
    ),
  ).rejects.toThrow('request completed');
  expect(preload).not.toHaveBeenCalled();
  expect(data).not.toHaveBeenCalled();
});

it('keeps loader continuation leased while registering returned deferred values', async () => {
  let active = 0;
  const value = deferred<string>();
  const context = {
    activeDeferreds: new Map(),
    work: {
      track<T>(promise: Promise<T>) {
        if (active === -1) throw new Error('lease already released');
        active++;
        void promise.then(
          () => {
            if (--active === 0) active = -1;
          },
          () => {
            if (--active === 0) active = -1;
          },
        );
        return promise;
      },
    },
  };
  await storage.run(context, () =>
    loader({ loader: async () => ({ value: value.promise }) })({}),
  );
  expect(active).toBeGreaterThan(0);
  value.resolve('done');
  await new Promise(resolve => setImmediate(resolve));
  expect(active).toBe(-1);
});
