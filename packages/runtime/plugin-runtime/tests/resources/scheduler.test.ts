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

  beforeEach(() => {
    document.head.innerHTML = '';
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
});
