import {
  ReloadManager,
  type ReloadableHandle,
  createReloadManager,
} from '../src/dev-tools/reloadManager';

rstest.useRealTimers();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
/** Drain the microtask queue (and one macrotask tick). */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function defer<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** A handle whose identity we can assert; returns a tagged sentinel response. */
function makeHandle(tag: string): ReloadableHandle {
  return rstest.fn(() => ({ tag }) as unknown as Response) as ReloadableHandle;
}

const fakeRequest = {} as Request;

describe('ReloadManager', () => {
  it('forwards requests to the initial handle before any reload', () => {
    const initial = makeHandle('initial');
    const manager = new ReloadManager({
      initialHandle: initial,
      build: async () => makeHandle('next'),
    });

    const result = manager.handle(fakeRequest, { node: {} });

    expect(initial).toHaveBeenCalledTimes(1);
    expect(initial).toHaveBeenCalledWith(fakeRequest, { node: {} });
    expect(result).toEqual({ tag: 'initial' });
    expect(manager.currentHandle).toBe(initial);
  });

  it('atomically swaps to the freshly built handle on a successful reload', async () => {
    const initial = makeHandle('initial');
    const next = makeHandle('next');
    const onReload = rstest.fn();
    const manager = createReloadManager({
      initialHandle: initial,
      build: async () => next,
      onReload,
    });

    await manager.reloadNow();

    expect(manager.currentHandle).toBe(next);
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(onReload).toHaveBeenCalledWith(next);

    // The stable forwarding handle now dispatches to the new handle.
    const result = manager.handle(fakeRequest);
    expect(next).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ tag: 'next' });
  });

  it('keeps the previous handle and reports the error when build fails', async () => {
    const initial = makeHandle('initial');
    const error = new Error('boom');
    const onError = rstest.fn();
    const onReload = rstest.fn();
    const manager = new ReloadManager({
      initialHandle: initial,
      build: async () => {
        throw error;
      },
      onError,
      onReload,
    });

    await manager.reloadNow();

    // Failure isolation: previous handle is retained, no swap happened.
    expect(manager.currentHandle).toBe(initial);
    expect(onReload).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);

    // The dev server keeps serving via the old handle.
    const result = manager.handle(fakeRequest);
    expect(initial).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ tag: 'initial' });
  });

  it('recovers: a failed reload followed by a successful one swaps in the new handle', async () => {
    const initial = makeHandle('initial');
    const recovered = makeHandle('recovered');
    let shouldFail = true;
    const manager = new ReloadManager({
      initialHandle: initial,
      build: async () => {
        if (shouldFail) {
          throw new Error('first build fails');
        }
        return recovered;
      },
      onError: () => {
        // swallow
      },
    });

    await manager.reloadNow();
    expect(manager.currentHandle).toBe(initial);

    shouldFail = false;
    await manager.reloadNow();
    expect(manager.currentHandle).toBe(recovered);
  });

  it('serializes overlapping reloads and keeps the last result', async () => {
    const initial = makeHandle('initial');
    const h1 = makeHandle('h1');
    const h2 = makeHandle('h2');
    const d1 = defer<ReloadableHandle>();
    const d2 = defer<ReloadableHandle>();
    const deferreds = [d1, d2];
    let buildIndex = 0;
    const build = rstest.fn(() => deferreds[buildIndex++]!.promise);

    const manager = new ReloadManager({
      initialHandle: initial,
      build,
    });

    // First reload starts and is in-flight (build #1 not yet resolved).
    const p1 = manager.reloadNow();
    // Second request arrives while the first is running -> coalesced, no new
    // build started yet (serial execution, no interleaving).
    const p2 = manager.reloadNow();
    expect(build).toHaveBeenCalledTimes(1);
    expect(manager.isReloading).toBe(true);

    // Resolve build #1 -> swap to h1, then the trailing reload starts build #2.
    d1.resolve(h1);
    await flush();
    expect(build).toHaveBeenCalledTimes(2);
    expect(manager.currentHandle).toBe(h1);

    // Resolve build #2 -> final handle is h2 ("last write wins").
    d2.resolve(h2);
    await Promise.all([p1, p2]);
    expect(manager.currentHandle).toBe(h2);
    expect(build).toHaveBeenCalledTimes(2);
    expect(manager.isReloading).toBe(false);
  });

  it('debounces rapid schedule() calls into a single build', async () => {
    const initial = makeHandle('initial');
    const next = makeHandle('next');
    const build = rstest.fn(async () => next);
    const manager = new ReloadManager({
      initialHandle: initial,
      build,
      debounceMs: 30,
    });

    manager.schedule();
    manager.schedule();
    manager.schedule();
    expect(build).toHaveBeenCalledTimes(0);

    await sleep(80);
    expect(build).toHaveBeenCalledTimes(1);
    expect(manager.currentHandle).toBe(next);
  });

  it('close() cancels a pending debounced reload', async () => {
    const initial = makeHandle('initial');
    const build = rstest.fn(async () => makeHandle('next'));
    const manager = new ReloadManager({
      initialHandle: initial,
      build,
      debounceMs: 30,
    });

    manager.schedule();
    manager.close();

    await sleep(80);
    expect(build).toHaveBeenCalledTimes(0);
    expect(manager.currentHandle).toBe(initial);
  });

  it('serves a 503 until setHandle seeds the initial known-good handle', () => {
    const seeded = makeHandle('seeded');
    const manager = new ReloadManager({
      build: async () => makeHandle('built'),
    });

    // Before any handle is seeded, the default handle replies 503.
    const notReady = manager.currentHandle(fakeRequest) as Response;
    expect(notReady.status).toBe(503);

    manager.setHandle(seeded);
    expect(manager.currentHandle).toBe(seeded);
    manager.handle(fakeRequest);
    expect(seeded).toHaveBeenCalledTimes(1);
  });

  it('does not roll back when onReload throws; reports via onReloadError', async () => {
    const initial = makeHandle('initial');
    const next = makeHandle('next');
    const onError = rstest.fn();
    const onReloadError = rstest.fn();
    const callbackError = new Error('previous-runtime cleanup failed');
    const manager = new ReloadManager({
      initialHandle: initial,
      build: async () => next,
      onReload: () => {
        throw callbackError;
      },
      onError,
      onReloadError,
    });

    await manager.reloadNow();

    // The swap is committed even though the onReload callback threw.
    expect(manager.currentHandle).toBe(next);
    // A successful build is NOT a failed reload, so onError must not fire.
    expect(onError).not.toHaveBeenCalled();
    // The post-swap callback failure is surfaced separately.
    expect(onReloadError).toHaveBeenCalledTimes(1);
    expect(onReloadError).toHaveBeenCalledWith(callbackError);
  });
});
