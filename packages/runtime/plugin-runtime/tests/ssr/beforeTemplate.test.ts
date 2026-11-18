import { buildShellBeforeTemplate } from '../../src/core/server/stream/beforeTemplate';
import {
  getLoadedScriptUrls,
  hasStylesheetLink,
} from '../../src/core/server/utils';

describe('hasStylesheetLink', () => {
  const href = '/static/css/async/three_user/page.css';

  test('returns true for stylesheet links', () => {
    expect(
      hasStylesheetLink(`<link href="${href}" rel="stylesheet" />`, href),
    ).toBe(true);
  });

  test('returns true when attributes are reordered', () => {
    expect(
      hasStylesheetLink(
        `<link rel="stylesheet" data-test="style" href="${href}">`,
        href,
      ),
    ).toBe(true);
  });

  test('returns true for single quoted stylesheet links', () => {
    expect(
      hasStylesheetLink(`<link rel='stylesheet' href='${href}'>`, href),
    ).toBe(true);
  });

  test('returns true when rel contains multiple tokens', () => {
    expect(
      hasStylesheetLink(`<link href="${href}" rel="preload stylesheet">`, href),
    ).toBe(true);
  });

  test('returns false for prefetch links', () => {
    expect(
      hasStylesheetLink(`<link href="${href}" rel="prefetch">`, href),
    ).toBe(false);
  });

  test('returns false for preload style links', () => {
    expect(
      hasStylesheetLink(`<link href="${href}" rel="preload" as="style">`, href),
    ).toBe(false);
  });

  test('returns false for different hrefs', () => {
    expect(
      hasStylesheetLink(
        `<link href="/static/css/async/other/page.css" rel="stylesheet">`,
        href,
      ),
    ).toBe(false);
  });
});

describe('getLoadedScriptUrls', () => {
  test('collects script src, script preload and modulepreload', () => {
    const urls = getLoadedScriptUrls(
      [
        '<script defer src="/static/js/main.js"></script>',
        `<script src='/static/js/lib.js'></script>`,
        '<script>inline()</script>',
        '<link href="/static/js/async/a.js" rel="preload" as="script">',
        '<link rel="modulepreload" href="/static/js/async/b.js">',
        '<link rel="prefetch" href="/static/js/async/c.js">',
        '<link rel="preload" as="style" href="/static/css/d.css">',
      ].join(''),
    );
    expect([...urls].sort()).toEqual([
      '/static/js/async/a.js',
      '/static/js/async/b.js',
      '/static/js/lib.js',
      '/static/js/main.js',
    ]);
  });
});

describe('stream SSR route resource stages', () => {
  const template =
    '<html><head><script defer src="/static/js/main.js"></script><!--<?- chunksMap.css ?>--></head><body>';

  const createRuntimeContext = (pathname: string) =>
    ({
      routes: [
        {
          id: 'layout',
          path: '/',
          children: [
            {
              id: 'user/layout',
              path: 'user',
              children: [
                { id: 'user/page', index: true },
                { id: 'user/[id]/page', path: ':id' },
              ],
            },
          ],
        },
      ],
      routerContext: { location: { pathname }, basename: '/' },
      routeManifest: {
        routeAssets: {
          main: {
            assets: ['/static/js/lib-react.js', '/static/js/main.js'],
          },
          layout: {
            assets: ['/static/js/main.js'],
          },
          'user/layout': {
            assets: [
              '/static/js/lib-react.js',
              '/static/js/async/shared.js',
              '/static/js/async/user/layout.js',
              '/static/css/async/user/layout.css',
            ],
            referenceCssAssets: ['/static/css/async/user/layout.css'],
          },
          'user/[id]/page': {
            assets: [
              '/static/js/async/shared.js',
              '/static/js/async/user/[id]/page.js',
            ],
          },
          'user/page': {
            assets: ['/static/js/async/user/page.js'],
          },
        },
      },
    }) as any;

  const getPreloads = (html: string) =>
    html.match(/<link rel="preload"[^>]*>/g) ?? [];

  const createStagesManifest = (routeRule: boolean) => ({
    version: 1,
    routeRule,
    routes: {
      'user/layout': {
        rc: [
          { h: '/static/js/async/shared.js', a: 'script', l: 1 },
          { h: '/static/js/async/user/layout.js', a: 'script', l: 1 },
        ],
      },
      'user/[id]/page': {
        c: [{ h: '/static/js/async/declared.js', a: 'script' }],
        rc: [
          { h: '/static/js/async/shared.js', a: 'script', l: 1 },
          { h: '/static/js/async/user/[id]/page.js', a: 'script', l: 1 },
        ],
      },
      'user/page': {
        rc: [{ h: '/static/js/async/user/page.js', a: 'script', l: 1 }],
      },
    },
  });

  test('outputs no preload without resource stages', async () => {
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext: createRuntimeContext('/user/1'),
      entryName: 'main',
      config: { nonce: 'abc', crossorigin: true },
    });
    // Only the route css, exactly as before resource stages existed.
    expect(html.match(/<link\b[^>]*>/g)).toEqual([
      '<link href="/static/css/async/user/layout.css" rel="stylesheet" />',
    ]);
    expect(html.match(/<script\b[^>]*>/g)).toEqual([
      '<script defer src="/static/js/main.js">',
    ]);
  });

  test('preloads the route js of the matched routes by the route rule', async () => {
    const runtimeContext = createRuntimeContext('/user/1');
    runtimeContext.routeManifest.resourceStages = createStagesManifest(true);
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: {},
    });
    expect(getPreloads(html)).toEqual([
      '<link rel="preload" as="script" href="/static/js/async/shared.js" fetchpriority="low" />',
      '<link rel="preload" as="script" href="/static/js/async/user/layout.js" fetchpriority="low" />',
      '<link rel="preload" as="script" href="/static/js/async/user/[id]/page.js" fetchpriority="low" />',
      '<link rel="preload" as="script" href="/static/js/async/declared.js" />',
    ]);
    // Route css stays a stylesheet, before the preloads.
    expect(html).toContain(
      '<link href="/static/css/async/user/layout.css" rel="stylesheet" /><link rel="preload"',
    );
    expect(html).not.toContain('user/page.js');
  });

  test.each([
    { requests: 4, size: 1000 },
    { requests: 20, size: 400 },
  ])(
    'shares the critical budget across the entry and nested routes (%j)',
    async budget => {
      const preload = (id: string, low = false) => ({
        h: '/static/js/' + id + '.js',
        a: 'script',
        b: 100,
        ...(low ? { l: 1 } : {}),
      });
      const group = (id: string, low = false) => ({
        id,
        files: [preload(id, low)],
      });
      const runtimeContext = createRuntimeContext('/user/1');
      runtimeContext.routeManifest.resourceStages = {
        version: 1,
        routeRule: true,
        budget,
        entries: { main: [preload('entry-first'), preload('entry-second')] },
        routes: {
          'user/layout': {
            declared: [group('entry-first')],
            own: [group('layout-chunk', true)],
            shared: [group('shared', true)],
          },
          'user/[id]/page': {
            declared: [group('page-declared')],
            own: [group('page-chunk', true)],
            shared: [group('shared', true)],
          },
          'user/page': { declared: [group('unmatched')] },
        },
      };
      const entryPreloads = ['entry-first', 'entry-second']
        .map(
          id =>
            '<link rel="preload" as="script" href="/static/js/' + id + '.js">',
        )
        .join('');
      const html = await buildShellBeforeTemplate(
        template.replace('<!--', entryPreloads + '<!--'),
        {
          runtimeContext,
          entryName: 'main',
          config: {},
        },
      );
      expect(
        getPreloads(html).map(tag => tag.match(/href="([^"]+)"/)?.[1]),
      ).toEqual([
        '/static/js/entry-first.js',
        '/static/js/entry-second.js',
        '/static/js/page-declared.js',
        '/static/js/layout-chunk.js',
      ]);
      expect(html).toContain('"visible":["page-chunk","shared"]');
    },
  );

  test('keeps external declarations when route preloads have no separate payload', async () => {
    const runtimeContext = createRuntimeContext('/user/1');
    runtimeContext.routeManifest.resourceStages = {
      version: 1,
      routeRule: true,
      routes: { 'user/layout': { u: ['/layout-stages.js', 'visible'] } },
    };
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: {},
    });
    expect(html).toContain('"u":["/layout-stages.js","visible"]');
  });

  test('does not preload route js when the route rule is off', async () => {
    const runtimeContext = createRuntimeContext('/user/1');
    runtimeContext.routeManifest.resourceStages = createStagesManifest(false);
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: {},
    });
    // Only the `critical` declaration of the route.
    expect(getPreloads(html)).toEqual([
      '<link rel="preload" as="script" href="/static/js/async/declared.js" />',
    ]);
  });

  test('skips scripts the entry or the template already loads', async () => {
    const runtimeContext = createRuntimeContext('/user/1');
    runtimeContext.routeManifest.resourceStages = createStagesManifest(true);
    runtimeContext.routeManifest.routeAssets['async-main'] = {
      assets: ['/static/js/async/user/layout.js'],
    };
    const html = await buildShellBeforeTemplate(
      template.replace(
        '<!--',
        '<link rel="preload" as="script" href="/static/js/async/shared.js"><!--',
      ),
      { runtimeContext, entryName: 'main', config: {} },
    );
    expect(getPreloads(html)).toEqual([
      '<link rel="preload" as="script" href="/static/js/async/shared.js">',
      '<link rel="preload" as="script" href="/static/js/async/user/[id]/page.js" fetchpriority="low" />',
      '<link rel="preload" as="script" href="/static/js/async/declared.js" />',
    ]);
  });

  test('adds integrity and crossorigin like the chunk loading runtime', async () => {
    const runtimeContext = createRuntimeContext('/user/1');
    const manifest = createStagesManifest(true);
    manifest.routes['user/[id]/page'].rc = [
      {
        h: 'https://cdn.example.com/static/js/async/user/[id]/page.js',
        a: 'script',
        l: 1,
      },
    ];
    runtimeContext.routeManifest.resourceStages = manifest;
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: { nonce: 'abc', crossorigin: true },
    });
    expect(getPreloads(html)).toEqual([
      // same origin chunk: the runtime does not set crossOrigin
      '<link rel="preload" as="script" href="/static/js/async/shared.js" nonce="abc" fetchpriority="low" />',
      '<link rel="preload" as="script" href="/static/js/async/user/layout.js" nonce="abc" fetchpriority="low" />',
      '<link rel="preload" as="script" href="https://cdn.example.com/static/js/async/user/[id]/page.js" crossorigin="anonymous" nonce="abc" fetchpriority="low" />',
      '<link rel="preload" as="script" href="/static/js/async/declared.js" nonce="abc" />',
    ]);

    // With Subresource Integrity the runtime sets both on every chunk.
    for (const route of Object.values(manifest.routes)) {
      for (const item of [...route.rc, ...((route as any).c ?? [])]) {
        item.i = `sha384-${item.h.length}`;
      }
    }
    const sri = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: {},
    });
    expect(getPreloads(sri)[0]).toBe(
      '<link rel="preload" as="script" href="/static/js/async/shared.js" crossorigin="anonymous" integrity="sha384-26" fetchpriority="low" />',
    );
    const credentials = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: { crossorigin: 'use-credentials' },
    });
    expect(getPreloads(credentials)[0]).toContain(
      'crossorigin="use-credentials" integrity="sha384-26"',
    );
  });

  test('does nothing without a route manifest', async () => {
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext: {} as any,
      entryName: 'main',
      config: {},
    });
    expect(html.match(/<link\b[^>]*>/g)).toBeNull();
    expect(html).not.toContain('chunksMap.css');
  });
});
