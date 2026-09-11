import { storage } from '@modern-js/runtime-utils/node';
import { handleRequest } from '../src/runtime';

it('keeps the application work scope in standalone loader requests', async () => {
  const tracked = new Set<Promise<unknown>>();
  const work = {
    track<T>(task: Promise<T>) {
      tracked.add(task);
      void task.then(
        () => tracked.delete(task),
        () => tracked.delete(task),
      );
      return task;
    },
  };
  let release!: () => void;
  const pending = new Promise<void>(resolve => {
    release = resolve;
  });
  const response = await handleRequest({
    request: new Request('http://localhost/?__loader=page'),
    serverRoutes: [{ urlPath: '/', entryName: 'main' }] as any,
    routes: [
      {
        id: 'page',
        path: '/',
        loader: () => {
          expect(storage.useContext().work).toBe(work);
          storage.useContext().work!.track(pending);
          return new Response('loader');
        },
      },
    ] as any,
    context: { monitors: { timing() {} } as any, work },
  });
  expect(await response!.text()).toBe('loader');
  expect(tracked.has(pending)).toBe(true);
  release();
  await pending;
  expect(tracked.size).toBe(0);
});

it('settles the deferred response producer on cancellation without cancelling original work', async () => {
  const { createDeferredReadableStream } = await import(
    '../src/runtime/response'
  );
  const { DeferredData } = await import('@modern-js/runtime-utils/browser');
  let resolve!: (value: string) => void;
  const original = new Promise<string>(done => {
    resolve = done;
  });
  const tasks = new Set<Promise<unknown>>();
  const work = {
    track<T>(task: Promise<T>) {
      tasks.add(task);
      void task.then(
        () => tasks.delete(task),
        () => tasks.delete(task),
      );
      return task;
    },
  };
  work.track(original);
  const data = new DeferredData({ value: original });
  const stream = createDeferredReadableStream(
    data,
    new AbortController().signal,
    work,
  );
  const reader = stream.getReader();
  await reader.read();
  expect(tasks.size).toBe(2);
  await reader.cancel();
  await new Promise(done => setImmediate(done));
  expect(tasks.size).toBe(1);
  resolve('late');
  await new Promise(done => setImmediate(done));
  expect(tasks.size).toBe(0);
});

it('still observes abort after one deferred field has settled', async () => {
  const { createDeferredReadableStream } = await import(
    '../src/runtime/response'
  );
  const { DeferredData } = await import('@modern-js/runtime-utils/browser');
  let first!: (value: string) => void;
  let second!: (value: string) => void;
  const data = new DeferredData({
    first: new Promise<string>(done => {
      first = done;
    }),
    second: new Promise<string>(done => {
      second = done;
    }),
  });
  const abort = new AbortController();
  const reader = createDeferredReadableStream(data, abort.signal).getReader();
  await reader.read();
  first('ready');
  await reader.read();
  abort.abort(new Error('disconnect'));
  await expect(reader.read()).rejects.toThrow('disconnect');
  second('late');
  await new Promise(done => setImmediate(done));
});

it('rejects deferred serialization errors and settles the response work', async () => {
  const { createDeferredReadableStream } = await import(
    '../src/runtime/response'
  );
  const { DeferredData } = await import('@modern-js/runtime-utils/browser');
  let release!: (value: bigint) => void;
  const data = new DeferredData({
    value: new Promise<bigint>(done => {
      release = done;
    }),
  });
  let completion!: Promise<void>;
  const work = {
    track<T>(task: Promise<T>) {
      completion = task as Promise<void>;
      return task;
    },
  };
  const reader = createDeferredReadableStream(
    data,
    new AbortController().signal,
    work,
  ).getReader();
  await reader.read();
  release(1n);
  await expect(reader.read()).rejects.toThrow();
  await completion;
});
