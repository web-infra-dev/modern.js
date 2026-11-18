import { rs } from '@rstest/core';
import { ResourceStageScheduler } from '../../src/core/resources/scheduler';

type Loader = (chunkId: string | number) => Promise<unknown>;

const g = globalThis as unknown as {
  __webpack_chunk_load_test__: Loader;
  __webpack_get_script_filename_test__: (chunkId: string | number) => string;
  __webpack_public_path_test__: string;
  __webpack_nonce_test__?: string;
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

describe('ResourceStageScheduler', () => {
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
    const scheduler = new ResourceStageScheduler([
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
    const scheduler = new ResourceStageScheduler([
      { c: manual, s: { idle: ['x', 'y'] } },
    ]);
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
    const scheduler = new ResourceStageScheduler([{ c: manual }]);
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
    const scheduler = new ResourceStageScheduler([
      { c: manual, s: { idle: ['shared', 'other'] } },
      { s: { visible: ['shared'] } },
    ]);
    scheduler.mark('visible');
    expect(prefetched()).toEqual(['/p/js/shared.js']);
  });

  it('resolves ready() after the stage and earlier stages are downloaded', async () => {
    const scheduler = new ResourceStageScheduler([
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
    const scheduler = new ResourceStageScheduler([
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
        const scheduler = new ResourceStageScheduler([
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
    const scheduler = new ResourceStageScheduler([
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
    const scheduler = new ResourceStageScheduler([
      { c: manual, s: { visible: ['a', 'b'] } },
    ]);
    scheduler.mark('visible');
    expect(prefetched()).toEqual(['/p/js/b.js']);
  });

  it('picks route lists of client rendered pages', () => {
    const scheduler = new ResourceStageScheduler([
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
    const scheduler = new ResourceStageScheduler([
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
      const scheduler = new ResourceStageScheduler([
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
    const scheduler = new ResourceStageScheduler([
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
      const scheduler = new ResourceStageScheduler([
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
      const scheduler = new ResourceStageScheduler([
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
    const scheduler = new ResourceStageScheduler([
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
    const scheduler = new ResourceStageScheduler([
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
      const scheduler = new ResourceStageScheduler([
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
});
