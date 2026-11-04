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

describe('stream SSR route script preload', () => {
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
    html.match(/<link rel="preload" as="script"[^>]*>/g) ?? [];

  test('preloads the js of every matched route once', async () => {
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext: createRuntimeContext('/user/1'),
      entryName: 'main',
      config: {},
    });
    expect(getPreloads(html)).toEqual([
      '<link rel="preload" as="script" href="/static/js/async/shared.js" />',
      '<link rel="preload" as="script" href="/static/js/async/user/layout.js" />',
      '<link rel="preload" as="script" href="/static/js/async/user/[id]/page.js" />',
    ]);
    // Route css keeps working and stays before the preloads.
    expect(html).toContain(
      '<link href="/static/css/async/user/layout.css" rel="stylesheet" /><link rel="preload"',
    );
    expect(html).not.toContain('user/page.js');
  });

  test('preloads the chunks split out of route dependencies at low priority', async () => {
    const runtimeContext = createRuntimeContext('/user/1');
    const { routeAssets } = runtimeContext.routeManifest;
    routeAssets['user/layout'].ownAssets = [
      '/static/js/async/user/layout.js',
      '/static/css/async/user/layout.css',
    ];
    routeAssets['user/[id]/page'].ownAssets = [
      '/static/js/async/user/[id]/page.js',
    ];
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: {},
    });
    expect(getPreloads(html)).toEqual([
      '<link rel="preload" as="script" href="/static/js/async/shared.js" fetchpriority="low" />',
      '<link rel="preload" as="script" href="/static/js/async/user/layout.js" />',
      '<link rel="preload" as="script" href="/static/js/async/user/[id]/page.js" />',
    ]);
  });

  test('skips scripts already loaded or preloaded by the template', async () => {
    const html = await buildShellBeforeTemplate(
      template.replace(
        '<!--',
        '<link rel="preload" as="script" href="/static/js/async/shared.js"><link rel="prefetch" href="/static/js/async/user/layout.js"><!--',
      ),
      {
        runtimeContext: createRuntimeContext('/user/1'),
        entryName: 'main',
        config: {},
      },
    );
    expect(getPreloads(html)).toEqual([
      '<link rel="preload" as="script" href="/static/js/async/shared.js">',
      '<link rel="preload" as="script" href="/static/js/async/user/layout.js" />',
      '<link rel="preload" as="script" href="/static/js/async/user/[id]/page.js" />',
    ]);
  });

  test('can be disabled by ssr.preloadRouteScripts', async () => {
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext: createRuntimeContext('/user/1'),
      entryName: 'main',
      config: {},
      ssrConfig: { preloadRouteScripts: false },
    });
    expect(getPreloads(html)).toEqual([]);
    expect(html).toContain(
      '<link href="/static/css/async/user/layout.css" rel="stylesheet" />',
    );
  });

  test('does not preload the async entry scripts', async () => {
    const runtimeContext = createRuntimeContext('/user');
    runtimeContext.routeManifest.routeAssets['async-main'] = {
      assets: ['/static/js/async/async-main.js'],
    };
    runtimeContext.routeManifest.routeAssets['user/page'].assets.push(
      '/static/js/async/async-main.js',
    );
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: {},
    });
    expect(html).not.toContain('async-main.js');
    expect(html).toContain('href="/static/js/async/user/page.js"');
  });

  test('adds nonce and crossorigin like the chunk loading runtime', async () => {
    const runtimeContext = createRuntimeContext('/user/1');
    runtimeContext.routeManifest.routeAssets['user/[id]/page'].assets = [
      'https://cdn.example.com/static/js/async/user/[id]/page.js',
    ];
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: { nonce: 'abc', crossorigin: true },
    });
    expect(getPreloads(html)).toEqual([
      // same origin chunk: the runtime does not set crossOrigin
      '<link rel="preload" as="script" href="/static/js/async/shared.js" nonce="abc" />',
      '<link rel="preload" as="script" href="/static/js/async/user/layout.js" nonce="abc" />',
      '<link rel="preload" as="script" href="https://cdn.example.com/static/js/async/user/[id]/page.js" nonce="abc" crossorigin="anonymous" />',
    ]);

    const credentials = await buildShellBeforeTemplate(template, {
      runtimeContext,
      entryName: 'main',
      config: { crossorigin: 'use-credentials' },
    });
    expect(credentials).toContain(
      'href="/static/js/async/shared.js" crossorigin="use-credentials" />',
    );
  });

  test('does nothing without a route manifest', async () => {
    const html = await buildShellBeforeTemplate(template, {
      runtimeContext: {} as any,
      entryName: 'main',
      config: {},
    });
    expect(getPreloads(html)).toEqual([]);
  });
});
