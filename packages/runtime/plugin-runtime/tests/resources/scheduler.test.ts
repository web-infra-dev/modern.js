import { rs } from '@rstest/core';
import {
  getResourceStageReport,
  stagedImport,
} from '../../src/exports/resources';

type Loader = (chunkId: string | number) => Promise<unknown>;
type Payload = Record<string, unknown>;

const g = globalThis as unknown as {
  __webpack_chunk_load_test__: Loader;
  __webpack_get_script_filename_test__: (chunkId: string | number) => string;
  __webpack_public_path_test__: string;
  __webpack_nonce_test__?: string;
};

const stages = stagedImport as unknown as Record<
  string,
  typeof stagedImport.idle
>;

/**
 * Start the scheduler like a page does: the HTML pushes its payloads to the
 * global, and the first declaration starts the scheduler. Everything else
 * goes through the public API and the global the framework runtime pushes to.
 */
const start = (payloads: Payload[]) => {
  const w = window as unknown as Record<string, unknown>;
  w.__MODERN_RS__ = payloads;
  stagedImport.visible(() => Promise.resolve());
  const global = w.__MODERN_RS__ as { push: (payload: Payload) => void };
  return {
    mark: (stage: string) => stages[stage].mark(),
    add: (payload: Payload) => global.push(payload),
    setRoutes: (routeIds: string[]) => global.push({ q: routeIds }),
    whenDone: (stage: string) => stages[stage].ready(),
    getReport: () => getResourceStageReport()!,
    prefetchLoader: (loader: () => Promise<unknown>, stage: string) => {
      const element = document.createElement('div');
      stages[stage](loader).trigger(element);
      element.dispatchEvent(new Event('pointerenter'));
    },
  };
};

const prefetched = () =>
  [...document.head.querySelectorAll('link[rel="prefetch"]')].map(link =>
    link.getAttribute('href'),
  );

const finish = (href: string) => {
  const link = document.head.querySelector(
    `link[rel="prefetch"][href="${href}"]`,
  ) as HTMLLinkElement;
  link.onload?.(new Event('load'));
};

const manual = {
  o: ['visible', 'interactive', 'idle'],
  m: ['visible', 'interactive', 'idle'],
  n: 2,
};

describe('stagedImport scheduling', () => {
  let loaded: (string | number)[];

  // jsdom reports no support for `rel="prefetch"`.
  const relList = Object.getPrototypeOf(
    document.createElement('link').relList,
  ) as DOMTokenList;
  const { supports } = relList;
  afterEach(() => {
    relList.supports = supports;
    rs.restoreAllMocks();
  });

  beforeEach(() => {
    delete (window as unknown as Record<string, unknown>).__MODERN_RS__;
    relList.supports = () => true;
    document.head.innerHTML = '';
    // Drive script completion explicitly. Happy DOM fails external scripts
    // immediately, which cannot exercise the pending-list path.
    const append = document.head.appendChild.bind(document.head);
    rs.spyOn(document.head, 'appendChild').mockImplementation(node => {
      if (node instanceof HTMLScriptElement) {
        node.type = 'application/json';
      }
      return append(node);
    });
    loaded = [];
    g.__webpack_chunk_load_test__ = async chunkId => {
      loaded.push(chunkId);
    };
    g.__webpack_get_script_filename_test__ = chunkId => `js/${chunkId}.js`;
    g.__webpack_public_path_test__ = '/p/';
  });

  it('prefetches a stage when it arrives and the previous stage is done', () => {
    const scheduler = start([
      {
        c: manual,
        s: { visible: ['a', 'b', 'c'], interactive: ['d'] },
        k: { a: ['/p/css/a.css'] },
      },
    ]);
    expect(prefetched()).toEqual([]);

    scheduler.mark('interactive');
    // `interactive` implies `visible`; concurrency 2, and `a` has CSS too.
    expect(prefetched()).toEqual(['/p/js/a.js', '/p/css/a.css', '/p/js/b.js']);
    finish('/p/js/a.js');
    finish('/p/css/a.css');
    expect(prefetched()).toContain('/p/js/c.js');
    expect(prefetched()).not.toContain('/p/js/d.js');
    finish('/p/js/b.js');
    finish('/p/js/c.js');
    // `visible` finished, `interactive` starts.
    expect(prefetched()).toContain('/p/js/d.js');

    const records = scheduler.getReport().records;
    expect(records.find(record => record.chunkId === 'a')).toMatchObject({
      stage: 'visible',
    });
    expect(
      records.find(record => record.chunkId === 'a')?.prefetchEnd,
    ).toBeDefined();
  });

  it('drops a queued chunk the page requests itself', async () => {
    const scheduler = start([{ c: manual, s: { idle: ['x', 'y'] } }]);
    await g.__webpack_chunk_load_test__('x');
    expect(loaded).toEqual(['x']);
    scheduler.mark('idle');
    expect(prefetched()).toEqual(['/p/js/y.js']);
    expect(
      scheduler.getReport().records.find(record => record.chunkId === 'x')
        ?.requested,
    ).toBeDefined();
  });

  it('prefetches element stage chunks without executing the module', () => {
    const scheduler = start([{ c: manual }]);
    let executed = false;
    scheduler.prefetchLoader(
      () =>
        Promise.all([
          g.__webpack_chunk_load_test__('m1'),
          g.__webpack_chunk_load_test__('m2'),
        ]).then(() => {
          executed = true;
        }),
      'interaction',
    );
    expect(prefetched()).toEqual(['/p/js/m1.js', '/p/js/m2.js']);
    expect(loaded).toEqual([]);
    expect(executed).toBe(false);
  });

  it('moves a chunk to an earlier stage a later list asks for', () => {
    const scheduler = start([
      { c: manual, s: { idle: ['shared', 'other'] } },
      { s: { visible: ['shared'] } },
    ]);
    scheduler.mark('visible');
    expect(prefetched()).toEqual(['/p/js/shared.js']);
  });

  it('resolves ready() after the stage and earlier stages are downloaded', async () => {
    const scheduler = start([
      { c: manual, s: { visible: ['v'], idle: ['i'] } },
    ]);
    let ready = false;
    scheduler.whenDone('idle').then(() => {
      ready = true;
    });
    scheduler.mark('idle');
    await Promise.resolve();
    expect(ready).toBe(false);
    finish('/p/js/v.js');
    finish('/p/js/i.js');
    await Promise.resolve();
    expect(ready).toBe(true);
  });

  it('waits for an outside stage list before running later prefetches or resolving ready()', async () => {
    const scheduler = start([
      { c: manual, s: { visible: ['first'], idle: ['last'] } },
      { u: ['/interactive-stages.js', 'interactive'] },
    ]);
    let ready = false;
    void scheduler.whenDone('idle').then(() => {
      ready = true;
    });
    scheduler.mark('idle');
    expect(prefetched()).toEqual(['/p/js/first.js']);
    finish('/p/js/first.js');
    await Promise.resolve();
    expect(ready).toBe(false);
    expect(prefetched()).not.toContain('/p/js/last.js');

    const script = document.querySelector<HTMLScriptElement>(
      'script[src="/interactive-stages.js"]',
    )!;
    scheduler.add({ s: { interactive: ['middle'] } });
    expect(prefetched()).not.toContain('/p/js/middle.js');
    script.onload?.(new Event('load'));
    expect(prefetched()).toEqual(['/p/js/first.js', '/p/js/middle.js']);
    finish('/p/js/middle.js');
    finish('/p/js/last.js');
    await Promise.resolve();
    expect(ready).toBe(true);
  });

  it.each(['error', 'timeout'])(
    'unblocks later stages after an outside stage list %s',
    async outcome => {
      rs.useFakeTimers();
      try {
        const scheduler = start([
          { c: manual, s: { idle: ['last'] } },
          { u: ['/missing-stages.js', 'visible'] },
        ]);
        const ready = scheduler.whenDone('idle');
        scheduler.mark('idle');
        expect(prefetched()).toEqual([]);
        const script = document.querySelector<HTMLScriptElement>(
          'script[src="/missing-stages.js"]',
        )!;
        if (outcome === 'timeout') {
          rs.advanceTimersByTime(30000);
          expect(script.isConnected).toBe(false);
        } else {
          script.onerror?.(new Event('error'));
        }
        expect(prefetched()).toEqual(['/p/js/last.js']);
        finish('/p/js/last.js');
        await ready;
      } finally {
        rs.useRealTimers();
      }
    },
  );

  it('uses the initial client routes when their outside stage list arrives late', () => {
    const scheduler = start([
      { c: manual, u: ['/route-stages.js', 'visible'] },
      { q: ['home'] },
    ]);
    scheduler.mark('visible');
    scheduler.add({
      r: {
        home: { s: { visible: ['home'] } },
        other: { s: { visible: ['other'] } },
      },
    });
    const script = document.querySelector<HTMLScriptElement>(
      'script[src="/route-stages.js"]',
    )!;
    script.onload?.(new Event('load'));
    expect(prefetched()).toEqual(['/p/js/home.js']);
    finish('/p/js/home.js');
  });

  it('skips files the HTML already preloads', () => {
    document.head.innerHTML =
      '<link rel="preload" as="script" href="/p/js/a.js">';
    const scheduler = start([{ c: manual, s: { visible: ['a', 'b'] } }]);
    scheduler.mark('visible');
    expect(prefetched()).toEqual(['/p/js/b.js']);
  });

  it('picks route lists of client rendered pages', () => {
    const scheduler = start([
      {
        c: manual,
        r: {
          home: { s: { visible: ['h'] } },
          other: { s: { visible: ['o'] } },
        },
      },
    ]);
    scheduler.setRoutes(['layout', 'home']);
    scheduler.mark('visible');
    expect(prefetched()).toEqual(['/p/js/h.js']);
  });

  it('marks a custom stage after its timeout', async () => {
    const scheduler = start([
      {
        c: {
          o: ['visible', 'firstReply', 'idle'],
          m: ['visible', 'firstReply', 'idle'],
          t: { firstReply: 10 },
        },
        s: { firstReply: ['r'] },
      },
    ]);
    scheduler.mark('visible');
    expect(prefetched()).toEqual([]);
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(scheduler.getReport().stages.firstReply).toBeDefined();
    expect(prefetched()).toEqual(['/p/js/r.js']);
  });

  it('skips idle and element stages when saving data', () => {
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true },
      configurable: true,
    });
    try {
      const scheduler = start([
        { c: manual, s: { visible: ['v'], idle: ['i'] } },
      ]);
      scheduler.mark('idle');
      finish('/p/js/v.js');
      expect(prefetched()).toEqual(['/p/js/v.js']);
      expect(scheduler.getReport().skipped).toEqual(['idle']);
    } finally {
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        configurable: true,
      });
    }
  });

  it('does not request a script for chunks without a JS file', () => {
    const scheduler = start([
      {
        c: manual,
        s: { visible: ['styles', 'empty', 'a'] },
        k: { styles: ['/p/css/styles.css'] },
        d: ['styles', 'empty'],
      },
    ]);
    scheduler.mark('visible');
    expect(prefetched()).toEqual(['/p/css/styles.css', '/p/js/a.js']);
  });

  it('skips prefetching when the browser does not support it', async () => {
    relList.supports = () => false;
    {
      const scheduler = start([
        { c: manual, s: { visible: ['v'], idle: ['i'] } },
      ]);
      let ready = false;
      scheduler.whenDone('idle').then(() => {
        ready = true;
      });
      scheduler.mark('idle');
      scheduler.prefetchLoader(
        () => g.__webpack_chunk_load_test__('m'),
        'interaction',
      );
      await Promise.resolve();
      expect(prefetched()).toEqual([]);
      expect(loaded).toEqual([]);
      expect(ready).toBe(true);
      expect(scheduler.getReport().skipped).toEqual([
        'visible',
        'idle',
        'interaction',
      ]);
    }
  });

  it('frees the slot of a prefetch that never settles', () => {
    rs.useFakeTimers();
    try {
      const scheduler = start([
        { c: { ...manual, n: 1 }, s: { visible: ['a', 'b'] } },
      ]);
      scheduler.mark('visible');
      expect(prefetched()).toEqual(['/p/js/a.js']);
      rs.advanceTimersByTime(30000);
      expect(prefetched()).toEqual(['/p/js/a.js', '/p/js/b.js']);
      // A late event of the first prefetch does not free a second slot.
      finish('/p/js/a.js');
      expect(
        scheduler.getReport().records.find(record => record.chunkId === 'a')
          ?.prefetchEnd,
      ).toBeDefined();
    } finally {
      rs.useRealTimers();
    }
  });

  it('takes the stage and the routes the framework runtime pushes', () => {
    const scheduler = start([
      {
        c: { o: ['visible', 'interactive', 'idle'], m: ['idle'] },
        s: { interactive: ['i'] },
        r: { home: { s: { visible: ['h'] } } },
      },
      { q: ['layout', 'home'] },
      { a: ['interactive', 120] },
    ]);
    expect(scheduler.getReport().stages).toMatchObject({
      visible: 120,
      interactive: 120,
    });
    expect(prefetched()).toEqual(['/p/js/h.js']);
    finish('/p/js/h.js');
    expect(prefetched()).toContain('/p/js/i.js');
  });

  it('leaves a manual stage to the application', () => {
    const scheduler = start([
      { c: manual, s: { interactive: ['i'] } },
      { a: ['interactive', 120] },
    ]);
    expect(scheduler.getReport().stages).toEqual({});
    expect(prefetched()).toEqual([]);
  });

  it('sets crossorigin like the bundler runtime', () => {
    const crossOrigins = (x: 'anonymous' | 'use-credentials') => {
      document.head.innerHTML = '';
      g.__webpack_get_script_filename_test__ = chunkId =>
        chunkId === 'cdn' ? '' : `js/${chunkId}.js`;
      const scheduler = start([
        {
          c: { ...manual, x },
          s: { visible: ['same', 'cdn'] },
          k: { cdn: ['https://cdn.example.com/cdn.css'] },
          d: ['cdn'],
        },
      ]);
      scheduler.mark('visible');
      return [...document.head.querySelectorAll('link[rel="prefetch"]')].map(
        link => link.getAttribute('crossorigin'),
      );
    };
    expect(crossOrigins('anonymous')).toEqual([null, 'anonymous']);
    expect(crossOrigins('use-credentials')).toEqual([
      'use-credentials',
      'use-credentials',
    ]);
  });

  it.each(['critical', 'viewport', 'interaction', 'notConfigured'])(
    'resolves ready() of %s, which has no order',
    async stage => {
      const scheduler = start([{ c: manual, s: { visible: ['v'] } }]);
      await expect(scheduler.whenDone(stage)).resolves.toBeUndefined();
    },
  );

  it('resolves ready() of an element stage after its prefetch', async () => {
    const scheduler = start([{ c: manual }]);
    scheduler.prefetchLoader(
      () => g.__webpack_chunk_load_test__('m'),
      'interaction',
    );
    let ready = false;
    void scheduler.whenDone('interaction').then(() => {
      ready = true;
    });
    await Promise.resolve();
    expect(ready).toBe(false);
    finish('/p/js/m.js');
    await Promise.resolve();
    expect(ready).toBe(true);
  });

  it('adds the lists of routes a client side navigation matches', () => {
    const scheduler = start([
      {
        c: manual,
        r: {
          home: { s: { visible: ['h'] } },
          other: { s: { visible: ['o'] } },
        },
      },
    ]);
    scheduler.setRoutes(['layout', 'home']);
    scheduler.mark('visible');
    expect(prefetched()).toEqual(['/p/js/h.js']);
    scheduler.setRoutes(['layout', 'home']);
    scheduler.setRoutes(['layout', 'other']);
    expect(prefetched()).toEqual(['/p/js/h.js', '/p/js/o.js']);
  });

  it('prefixes CSS files with the public path at prefetch time', () => {
    const scheduler = start([
      {
        c: manual,
        s: { visible: ['a', 'b'] },
        k: { a: ['css/a.css'], b: ['https://cdn.example.com/b.css'] },
      },
    ]);
    // An application switching CDN at runtime.
    g.__webpack_public_path_test__ = 'https://cdn2.example.com/';
    scheduler.mark('visible');
    expect(prefetched()).toEqual([
      'https://cdn2.example.com/js/a.js',
      'https://cdn2.example.com/css/a.css',
      'https://cdn2.example.com/js/b.js',
      'https://cdn.example.com/b.css',
    ]);
  });

  it('ignores stages and routes pushed by another application', () => {
    const scheduler = start([
      {
        c: { ...manual, b: 'host' },
        s: { interactive: ['i'] },
        r: { home: { s: { visible: ['h'] } } },
      },
    ]);
    scheduler.add({ q: ['home'], b: 'child' });
    scheduler.add({ a: ['visible', 10], b: 'child' });
    expect(scheduler.getReport().stages).toEqual({});
    scheduler.add({ q: ['home'], b: 'host' });
    scheduler.mark('visible');
    expect(prefetched()).toEqual(['/p/js/h.js']);
  });

  it('passes a loadable descriptor through and has no `then`', () => {
    const descriptor = {
      requireAsync: () => Promise.resolve(),
      chunkName: () => 'a',
    };
    const declared = stagedImport.idle(
      descriptor as unknown as () => Promise<unknown>,
    );
    expect(declared).toBe(descriptor);
    expect(typeof declared.trigger).toBe('function');
    expect((stagedImport as unknown as { then?: unknown }).then).toBe(
      undefined,
    );
  });

  it('prefetches the chunks and CSS the build mapped to an element declaration, without calling the loader', () => {
    start([
      {
        c: manual,
        e: {
          k1: { s: ['m1'], k: { m1: ['css/m1.css'] } },
          // An import() that is not split into a chunk: nothing to prefetch.
          k2: { s: [] },
        },
      },
    ]);
    let called = 0;
    const loader = () => {
      called++;
      return Promise.resolve();
    };
    const element = document.createElement('div');
    stages.interaction(loader, 'k1').trigger(element);
    element.dispatchEvent(new Event('pointerenter'));
    expect(prefetched()).toEqual(['/p/js/m1.js', '/p/css/m1.css']);

    const other = document.createElement('div');
    stages.interaction(loader, 'k2').trigger(other);
    other.dispatchEvent(new Event('pointerenter'));
    expect(called).toBe(0);
    expect(prefetched()).toEqual(['/p/js/m1.js', '/p/css/m1.css']);
  });

  it('releases every element of a declaration once one triggers', () => {
    start([{ c: manual, e: { k: { s: ['m'] } } }]);
    const declared = stages.interaction(() => Promise.resolve(), 'k');
    const a = document.createElement('div');
    const b = document.createElement('div');
    const removeA = rs.spyOn(a, 'removeEventListener');
    const removeB = rs.spyOn(b, 'removeEventListener');
    declared.trigger(a);
    declared.trigger(b);
    a.dispatchEvent(new Event('pointerenter'));
    expect(removeA).toHaveBeenCalledTimes(3);
    expect(removeB).toHaveBeenCalledTimes(3);
    expect(prefetched()).toEqual(['/p/js/m.js']);
  });

  it('releases an element with the function trigger returns, and a removed element after trigger(null)', async () => {
    start([{ c: manual, e: { k: { s: ['m'] } } }]);
    const declared = stages.interaction(() => Promise.resolve(), 'k');
    const a = document.createElement('div');
    const release = declared.trigger(a) as () => void;
    release();
    a.dispatchEvent(new Event('pointerenter'));
    expect(prefetched()).toEqual([]);

    // React 18 calls trigger(null) when the ref is detached; the element
    // leaves the document right after.
    const b = document.createElement('div');
    document.body.appendChild(b);
    declared.trigger(b);
    declared.trigger(null);
    b.remove();
    await Promise.resolve();
    b.dispatchEvent(new Event('pointerenter'));
    expect(prefetched()).toEqual([]);

    // An element still in the document keeps working.
    const c = document.createElement('div');
    document.body.appendChild(c);
    declared.trigger(c);
    declared.trigger(null);
    await Promise.resolve();
    c.dispatchEvent(new Event('pointerenter'));
    expect(prefetched()).toEqual(['/p/js/m.js']);
    c.remove();
  });

  it('disconnects every viewport observer once one element is visible', () => {
    const observers: {
      callback: IntersectionObserverCallback;
      disconnected: boolean;
    }[] = [];
    const original = (window as unknown as { IntersectionObserver?: unknown })
      .IntersectionObserver;
    (
      window as unknown as { IntersectionObserver: unknown }
    ).IntersectionObserver = class {
      record: { callback: IntersectionObserverCallback; disconnected: boolean };
      constructor(callback: IntersectionObserverCallback) {
        this.record = { callback, disconnected: false };
        observers.push(this.record);
      }
      observe() {}
      disconnect() {
        this.record.disconnected = true;
      }
    };
    try {
      start([{ c: manual, e: { k: { s: ['v'] } } }]);
      const declared = stages.viewport(() => Promise.resolve(), 'k');
      declared.trigger(document.createElement('div'));
      declared.trigger(document.createElement('div'));
      observers[0].callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      expect(observers.map(item => item.disconnected)).toEqual([true, true]);
      expect(prefetched()).toEqual(['/p/js/v.js']);
    } finally {
      (
        window as unknown as { IntersectionObserver?: unknown }
      ).IntersectionObserver = original;
    }
  });

  it('records whether a prefetch loaded, failed or timed out', () => {
    rs.useFakeTimers();
    const scheduler = start([
      { c: { ...manual, n: 3 }, s: { visible: ['ok', 'err', 'slow'] } },
    ]);
    scheduler.mark('visible');
    finish('/p/js/ok.js');
    (
      document.head.querySelector(
        'link[href="/p/js/err.js"]',
      ) as HTMLLinkElement
    ).onerror?.(new Event('error'));
    rs.advanceTimersByTime(30000);
    const status = Object.fromEntries(
      scheduler
        .getReport()
        .records.map(record => [record.chunkId, record.prefetchStatus]),
    );
    expect(status).toEqual({ ok: 'ok', err: 'error', slow: 'timeout' });
    rs.useRealTimers();
  });

  it('sets crossorigin on same origin prefetches with Subresource Integrity', () => {
    const scheduler = start([
      { c: { ...manual, x: 'anonymous', z: 1 }, s: { visible: ['a'] } },
    ]);
    scheduler.mark('visible');
    expect(
      document.head
        .querySelector('link[href="/p/js/a.js"]')
        ?.getAttribute('crossorigin'),
    ).toBe('anonymous');
  });

  it('does not download an external payload when the browser cannot prefetch', () => {
    relList.supports = () => false;
    const scheduler = start([
      { c: manual, u: ['static/js/resource-stages/entry-main.js', 'visible'] },
    ]);
    scheduler.mark('visible');
    expect(document.head.querySelectorAll('script').length).toBe(0);
    expect(scheduler.getReport().skipped).toContain('visible');
  });

  it('sets crossorigin on an external payload by its final URL', () => {
    g.__webpack_public_path_test__ = 'https://cdn.example.com/p/';
    const scheduler = start([
      {
        c: { ...manual, x: 'anonymous' },
        u: ['static/js/resource-stages/entry-main.js', 'visible'],
      },
    ]);
    scheduler.mark('visible');
    const script = document.head.querySelector('script');
    expect(script?.getAttribute('src')).toBe(
      'https://cdn.example.com/p/static/js/resource-stages/entry-main.js',
    );
    expect(script?.getAttribute('crossorigin')).toBe('anonymous');
  });

  it('marks idle at most 10 seconds after load, even within the quiet window', () => {
    rs.useFakeTimers();
    let time = 0;
    rs.spyOn(performance, 'now').mockImplementation(() => time);
    const callbacks: Record<string, PerformanceObserverCallback> = {};
    const original = window.PerformanceObserver;
    (
      window as unknown as { PerformanceObserver: unknown }
    ).PerformanceObserver = class {
      callback: PerformanceObserverCallback;
      constructor(callback: PerformanceObserverCallback) {
        this.callback = callback;
      }
      observe({ type }: { type: string }) {
        callbacks[type] = this.callback;
      }
      disconnect() {}
    };
    try {
      const scheduler = start([
        { c: { o: ['visible', 'interactive', 'idle'], i: 2000 } },
      ]);
      // A request 9.9 s after load restarts the quiet window.
      time = 9900;
      callbacks.resource(
        {
          getEntries: () => [{ initiatorType: 'script' }],
        } as unknown as PerformanceObserverEntryList,
        {} as PerformanceObserver,
      );
      rs.advanceTimersByTime(99);
      expect(scheduler.getReport().stages.idle).toBeUndefined();
      time = 10000;
      rs.advanceTimersByTime(1);
      expect(scheduler.getReport().stages.idle).toBe(10000);
    } finally {
      window.PerformanceObserver = original;
      rs.useRealTimers();
    }
  });
});
