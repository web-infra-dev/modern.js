import { rstest } from '@rstest/core';
import { createSSRRequestCoordinator } from '../../src/adapters/node/requestCoordinator';
import { getCacheResult } from '../../src/plugins/render/ssrCache';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

it('holds stale revalidation through the asynchronous cache write', async () => {
  const coordinator = createSSRRequestCoordinator({
    maxPendingRequests: 1,
    requestTimeoutMs: 1000,
    drainTimeoutMs: 1000,
  });
  const writing = deferred<void>();
  const written = deferred<void>();
  const container = {
    get: async () => JSON.stringify({ val: 'stale', cursor: Date.now() - 200 }),
    set: async () => {
      writing.resolve();
      await written.promise;
      return container;
    },
    has: async () => true,
    delete: async () => true,
  };
  const request = new Request('http://localhost/');
  const response = await coordinator.handle(request, work =>
    getCacheResult(request, {
      cacheControl: { maxAge: 100, staleWhileRevalidate: 1000 },
      container,
      requestHandler: async () => new Response('fresh'),
      requestHandlerOptions: { work } as any,
    }),
  );
  expect(await response.text()).toBe('stale');
  await writing.promise;
  const mutate = rstest.fn(async () => {});
  const update = coordinator.update(mutate);
  await new Promise(resolve => setImmediate(resolve));
  expect(mutate).not.toHaveBeenCalled();
  written.resolve();
  await expect(update).resolves.toBe(1);
});

it('response cancellation cancels the cache producer stream', async () => {
  const cancelled = rstest.fn();
  const container = {
    get: async () => undefined,
    set: rstest.fn(),
    has: async () => false,
    delete: async () => false,
  };
  const request = new Request('http://localhost/');
  const response = await getCacheResult(request, {
    cacheControl: { maxAge: 100, staleWhileRevalidate: 1000 },
    container,
    requestHandler: async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('shell'));
          },
          cancel: cancelled,
        }),
      ),
    requestHandlerOptions: {} as any,
  });
  const reader = response.body!.getReader();
  await reader.read();
  await reader.cancel();
  await new Promise(resolve => setImmediate(resolve));
  expect(cancelled).toHaveBeenCalledTimes(1);
  expect(container.set).not.toHaveBeenCalled();
});

it('a stream failure rejects the cache response body without writing a partial cache', async () => {
  const container = {
    get: async () => undefined,
    set: rstest.fn(),
    has: async () => false,
    delete: async () => false,
  };
  const request = new Request('http://localhost/');
  const response = await getCacheResult(request, {
    cacheControl: { maxAge: 100, staleWhileRevalidate: 1000 },
    container,
    requestHandler: async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new Error('render failed'));
          },
        }),
      ),
    requestHandlerOptions: {} as any,
  });
  await expect(response.text()).rejects.toThrow('render failed');
  expect(container.set).not.toHaveBeenCalled();
});
