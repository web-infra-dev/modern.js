import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';

type Ensure = (chunkId: string, fetchPriority?: string) => Promise<void>;
type TestGlobal = typeof globalThis & {
  __webpack_chunk_load_test__?: Ensure;
  __MODERN_PREFETCH__?: unknown;
};
const g = globalThis as TestGlobal;

interface Pending {
  chunkId: string;
  fetchPriority?: string;
  resolve: () => void;
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('prefetch', () => {
  let pending: Pending[];
  let started: string[];

  beforeEach(() => {
    rs.resetModules();
    pending = [];
    started = [];
    delete g.__MODERN_PREFETCH__;
    g.__webpack_chunk_load_test__ = (chunkId, fetchPriority) => {
      started.push(`${chunkId}:${fetchPriority ?? 'auto'}`);
      return new Promise<void>(resolve => {
        pending.push({ chunkId, fetchPriority, resolve });
      });
    };
  });

  afterEach(() => {
    delete g.__webpack_chunk_load_test__;
    delete g.__MODERN_PREFETCH__;
  });

  const load = async () => {
    const { prefetch } = await import('../../src/core/browser/prefetch');
    const ensure = () => g.__webpack_chunk_load_test__ as Ensure;
    return { prefetch, ensure };
  };

  const finish = async (chunkId: string) => {
    const index = pending.findIndex(item => item.chunkId === chunkId);
    pending.splice(index, 1)[0].resolve();
    await flush();
  };

  it('holds chunk requests until the after signal and runs them with low priority', async () => {
    const { prefetch, ensure } = await load();
    let ready!: () => void;
    const after = new Promise<void>(resolve => {
      ready = resolve;
    });
    const done = prefetch([() => ensure()('a'), () => ensure()('b')], {
      idle: false,
      after,
      concurrency: 2,
    });
    await flush();
    expect(started).toEqual([]);

    ready();
    await flush();
    expect(started).toEqual(['a:low', 'b:low']);
    await finish('a');
    await finish('b');
    await expect(done).resolves.toBeUndefined();
  });

  it('keeps at most `concurrency` prefetch requests in flight', async () => {
    const { prefetch, ensure } = await load();
    prefetch(
      ['a', 'b', 'c'].map(id => () => ensure()(id)),
      { idle: false, concurrency: 1 },
    );
    await flush();
    expect(started).toEqual(['a:low']);
    await finish('a');
    expect(started).toEqual(['a:low', 'b:low']);
    await finish('b');
    expect(started).toEqual(['a:low', 'b:low', 'c:low']);
  });

  it('starts a queued chunk right away at normal priority when the page requests it', async () => {
    const { prefetch, ensure } = await load();
    let prefetched = false;
    prefetch(
      [
        () => ensure()('a'),
        () =>
          ensure()('b').then(() => {
            prefetched = true;
          }),
      ],
      { idle: false, concurrency: 1 },
    );
    await flush();
    expect(started).toEqual(['a:low']);

    const urgent = ensure()('b');
    expect(started).toEqual(['a:low', 'b:auto']);
    await finish('b');
    await expect(urgent).resolves.toBeUndefined();
    expect(prefetched).toBe(true);

    await finish('a');
    // b already loaded, so the queue has nothing left to start
    expect(started).toEqual(['a:low', 'b:auto']);
  });

  it('leaves chunk requests made outside prefetch untouched', async () => {
    const { prefetch, ensure } = await load();
    prefetch([() => ensure()('a')], { idle: false, concurrency: 1 });
    ensure()('x', 'high');
    expect(started).toEqual(['x:high']);
  });

  it('resolves even when a task throws', async () => {
    const { prefetch } = await load();
    await expect(
      prefetch(
        [
          () => {
            throw new Error('boom');
          },
        ],
        { idle: false },
      ),
    ).resolves.toBeUndefined();
  });
});
