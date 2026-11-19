/**
 * Low-priority prefetching of async chunks.
 *
 * `prefetch(tasks)` runs each task (typically `() => import('./x')`) and puts every chunk
 * request the task starts synchronously into a shared low-priority queue:
 * - the queue starts after the page has loaded and the main thread is idle,
 * - at most `concurrency` chunk requests from the queue are in flight at a time,
 * - queued requests are sent with `fetchpriority="low"`,
 * - a regular (non-prefetch) request for a chunk that is still queued starts it right away,
 *   so prefetching never delays a chunk the page actually needs.
 */

export type PrefetchTask = () => unknown;

export interface PrefetchOptions {
  /**
   * Maximum number of chunk requests started by `prefetch` that may be in flight at once.
   * The queue is shared by every `prefetch` call; the last value passed wins.
   * @default 2
   */
  concurrency?: number;
  /**
   * Extra condition to wait for before the queue starts, e.g. a promise resolved when the
   * first screen is interactive.
   */
  after?: Promise<unknown>;
  /**
   * Wait for the `load` event and an idle period before starting.
   * @default true
   */
  idle?: boolean;
}

type ChunkId = string | number;
type EnsureChunk = (chunkId: ChunkId, fetchPriority?: string) => Promise<void>;

interface QueueItem {
  chunkId: ChunkId;
  resolve: () => void;
  reject: (error: unknown) => void;
  started: boolean;
}

interface PrefetchState {
  original: EnsureChunk;
  queue: QueueItem[];
  queued: Map<ChunkId, QueueItem>;
  inFlight: number;
  concurrency: number;
  capturing: boolean;
  gates: Promise<unknown>[];
  open: boolean;
  /** Chunk ids requested through the queue, for debugging and tracing. */
  requested: ChunkId[];
}

// `__webpack_chunk_load__` (the bundler's ensure-chunk function, `__webpack_require__.e`);
// replaced at library build time, see rstack.config.mts. It is assignable, which is how the
// queue intercepts chunk requests.
declare let WEBPACK_CHUNK_LOAD: EnsureChunk | undefined;

const STATE_KEY = '__MODERN_PREFETCH__';
const DEFAULT_CONCURRENCY = 2;

const getEnsureChunk = (): EnsureChunk | undefined => {
  try {
    return typeof WEBPACK_CHUNK_LOAD === 'function'
      ? WEBPACK_CHUNK_LOAD
      : undefined;
  } catch {
    return undefined;
  }
};

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
};

const whenIdle = (): Promise<void> =>
  new Promise(resolve => {
    const idle = () => {
      const { requestIdleCallback } = window as IdleWindow;
      if (requestIdleCallback) {
        requestIdleCallback(() => resolve(), { timeout: 2000 });
      } else {
        setTimeout(resolve, 200);
      }
    };
    if (document.readyState === 'complete') {
      idle();
    } else {
      window.addEventListener('load', idle, { once: true });
    }
  });

const settle = (state: PrefetchState, item: QueueItem): void => {
  state.inFlight -= 1;
  state.queued.delete(item.chunkId);
};

const pump = (state: PrefetchState): void => {
  if (!state.open) {
    return;
  }
  while (state.inFlight < state.concurrency && state.queue.length > 0) {
    const item = state.queue.shift() as QueueItem;
    if (item.started) {
      continue;
    }
    item.started = true;
    state.inFlight += 1;
    state.original(item.chunkId, 'low').then(
      () => {
        settle(state, item);
        item.resolve();
        pump(state);
      },
      (error: unknown) => {
        settle(state, item);
        item.reject(error);
        pump(state);
      },
    );
  }
};

const enqueue = (state: PrefetchState, chunkId: ChunkId): Promise<void> => {
  const queued = state.queued.get(chunkId);
  return new Promise<void>((resolve, reject) => {
    if (queued) {
      // Several prefetch tasks share this chunk: settle them together.
      const prevResolve = queued.resolve;
      const prevReject = queued.reject;
      queued.resolve = () => {
        prevResolve();
        resolve();
      };
      queued.reject = (error: unknown) => {
        prevReject(error);
        reject(error);
      };
      return;
    }
    const item: QueueItem = { chunkId, resolve, reject, started: false };
    state.queue.push(item);
    state.queued.set(chunkId, item);
    state.requested.push(chunkId);
    pump(state);
  });
};

const install = (): PrefetchState | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const holder = window as unknown as Record<string, PrefetchState | undefined>;
  const existing = holder[STATE_KEY];
  if (existing) {
    return existing;
  }
  const ensureChunk = getEnsureChunk();
  if (!ensureChunk) {
    return undefined;
  }
  const state: PrefetchState = {
    original: ensureChunk,
    queue: [],
    queued: new Map(),
    inFlight: 0,
    concurrency: DEFAULT_CONCURRENCY,
    capturing: false,
    gates: [],
    open: false,
    requested: [],
  };
  WEBPACK_CHUNK_LOAD = (chunkId: ChunkId, fetchPriority?: string) => {
    if (state.capturing) {
      return enqueue(state, chunkId);
    }
    const queued = state.queued.get(chunkId);
    if (queued && !queued.started) {
      // The page needs this chunk now: start it at normal priority.
      queued.started = true;
      state.queued.delete(chunkId);
      const request = state.original(chunkId, fetchPriority);
      request.then(queued.resolve, queued.reject);
      return request;
    }
    return state.original(chunkId, fetchPriority);
  };
  holder[STATE_KEY] = state;
  return state;
};

const openWhenReady = (state: PrefetchState, idle: boolean): void => {
  if (state.open) {
    return;
  }
  const gates = state.gates.slice();
  const open = () => {
    // A newer call may have added gates while we were waiting.
    if (state.gates.length !== gates.length) {
      openWhenReady(state, idle);
      return;
    }
    state.open = true;
    pump(state);
  };
  Promise.all([idle ? whenIdle() : undefined, ...gates]).then(open, open);
};

/**
 * Run `tasks` with every chunk request they start synchronously moved to the shared
 * low-priority prefetch queue. Resolves when all tasks have settled; task errors are
 * swallowed, since prefetching is best-effort and the page loads the chunk again on demand.
 */
export const prefetch = (
  tasks: PrefetchTask | PrefetchTask[],
  options: PrefetchOptions = {},
): Promise<void> => {
  const list = Array.isArray(tasks) ? tasks : [tasks];
  const state = install();
  if (!state) {
    // Not running in a bundled browser page: run the tasks without scheduling.
    return Promise.allSettled(
      list.map(task => Promise.resolve().then(task)),
    ).then(() => undefined);
  }
  if (options.concurrency && options.concurrency > 0) {
    state.concurrency = options.concurrency;
  }
  if (options.after) {
    state.gates.push(options.after);
  }
  openWhenReady(state, options.idle !== false);

  const results: unknown[] = [];
  state.capturing = true;
  try {
    for (const task of list) {
      try {
        results.push(task());
      } catch (error) {
        results.push(Promise.reject(error));
      }
    }
  } finally {
    state.capturing = false;
  }
  return Promise.allSettled(
    results.map(result => Promise.resolve(result)),
  ).then(() => undefined);
};
