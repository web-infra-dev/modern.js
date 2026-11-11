import type { Monitors, ServerRoute } from '@modern-js/types';
import { getEarlyHintLinks } from '../../src/plugins/render/earlyHints';
import { createRender } from '../../src/plugins/render/render';
import type { ServerManifest, UserConfig } from '../../src/types';

const route: ServerRoute = {
  urlPath: '/',
  entryName: 'main',
  entryPath: 'main.html',
  isSPA: true,
  isSSR: true,
};

const html = `<!doctype html><html><head>
<script defer src="/static/js/lib-react.js"></script>
<script defer src="/static/js/main.js"></script>
<link href="/static/css/main.css" rel="stylesheet" />
<link rel="prefetch" href="/static/js/async/other.js" />
<script>window.inline = 1</script>
</head><body><div id="root"><!--<?- html ?>--></div></body></html>`;

const serverManifest = {
  renderBundles: {
    main: { requestHandler: () => new Response('SSR') },
  },
  nestedRoutesJson: {
    main: [
      {
        id: 'layout',
        type: 'nested',
        path: '/',
        isRoot: true,
        children: [
          {
            id: 'user/layout',
            type: 'nested',
            path: 'user',
            children: [{ id: 'user/(id)/page', type: 'nested', path: ':id' }],
          },
          { id: 'about/page', type: 'nested', path: 'about' },
        ],
      },
    ],
  },
  routeManifest: {
    routeAssets: {
      main: { assets: ['/static/js/lib-react.js', '/static/js/main.js'] },
      layout: { assets: ['/static/js/main.js'] },
      'user/layout': {
        assets: [
          '/static/js/lib-react.js',
          '/static/js/async/user/layout.js',
          '/static/css/async/user/layout.css',
        ],
        referenceCssAssets: ['/static/css/async/user/layout.css'],
      },
      'user/(id)/page': {
        assets: ['/static/js/async/user/(id)/page.js'],
        referenceCssAssets: [
          '/static/css/async/user/(id)/page.css',
          '/static/css/async/lazy.css',
        ],
      },
      'about/page': { assets: ['/static/js/async/about/page.js'] },
    },
  },
} as unknown as ServerManifest;

const getLinks = (url: string, config: UserConfig = {} as UserConfig) =>
  getEarlyHintLinks({
    request: new Request(url),
    html,
    routeInfo: route,
    serverManifest,
    config,
  });

describe('getEarlyHintLinks', () => {
  it('hints the template assets and the assets of the matched routes', () => {
    expect(getLinks('http://localhost/user/1')).toEqual([
      '</static/js/lib-react.js>; rel=preload; as=script',
      '</static/js/main.js>; rel=preload; as=script',
      '</static/css/main.css>; rel=preload; as=style',
      '</static/js/async/user/layout.js>; rel=preload; as=script',
      '</static/css/async/user/layout.css>; rel=preload; as=style',
      '</static/js/async/user/(id)/page.js>; rel=preload; as=script',
      '</static/css/async/user/(id)/page.css>; rel=preload; as=style',
      '</static/css/async/lazy.css>; rel=preload; as=style',
    ]);
  });

  it('only hints the matched routes', () => {
    const links = getLinks('http://localhost/about');
    expect(links).toContain(
      '</static/js/async/about/page.js>; rel=preload; as=script',
    );
    expect(links.some(link => link.includes('/async/user/'))).toBe(false);
  });

  it('hints the template assets when no nested route matches', () => {
    expect(getLinks('http://localhost/not-found')).toEqual([
      '</static/js/lib-react.js>; rel=preload; as=script',
      '</static/js/main.js>; rel=preload; as=script',
      '</static/css/main.css>; rel=preload; as=style',
    ]);
  });

  it('skips route CSS when styles are inlined', () => {
    const links = getLinks('http://localhost/user/1', {
      output: { inlineStyles: true },
    } as UserConfig);
    expect(
      links.filter(
        link => link.includes('/async/') && link.includes('as=style'),
      ),
    ).toEqual([]);
  });

  it('follows the crossorigin of the template tags', () => {
    const links = getEarlyHintLinks({
      request: new Request('http://localhost/'),
      html: '<script crossorigin src="/a.js"></script><link crossorigin="use-credentials" rel="stylesheet" href="/a.css">',
      routeInfo: route,
      serverManifest: {} as ServerManifest,
      config: {} as UserConfig,
    });
    expect(links).toEqual([
      '</a.js>; rel=preload; as=script; crossorigin',
      '</a.css>; rel=preload; as=style; crossorigin=use-credentials',
    ]);
  });

  it('streaming SSR: route JS follows the bundler runtime crossorigin rule', () => {
    const cdnManifest = {
      ...serverManifest,
      routeManifest: {
        routeAssets: {
          'about/page': {
            assets: ['https://cdn.example.com/static/js/async/about/page.js'],
            referenceCssAssets: [
              'https://cdn.example.com/static/css/async/about/page.css',
            ],
          },
        },
      },
    } as unknown as ServerManifest;
    const links = getEarlyHintLinks({
      request: new Request('http://localhost/about'),
      html: '',
      routeInfo: route,
      serverManifest: cdnManifest,
      config: { html: { crossorigin: true } } as UserConfig,
    });
    expect(links).toEqual([
      '<https://cdn.example.com/static/js/async/about/page.js>; rel=preload; as=script; crossorigin',
      // Streaming SSR outputs route stylesheets without `crossorigin`.
      '<https://cdn.example.com/static/css/async/about/page.css>; rel=preload; as=style',
    ]);

    // Same-origin chunks are loaded without `crossorigin` unless it is
    // `use-credentials`.
    expect(
      getLinks('http://localhost/about', {
        html: { crossorigin: true },
      } as UserConfig),
    ).toContain('</static/js/async/about/page.js>; rel=preload; as=script');
    expect(
      getLinks('http://localhost/about', {
        html: { crossorigin: 'use-credentials' },
      } as UserConfig),
    ).toContain(
      '</static/js/async/about/page.js>; rel=preload; as=script; crossorigin=use-credentials',
    );
  });

  it('string SSR: route assets use html.crossorigin', () => {
    const links = getLinks('http://localhost/about', {
      html: { crossorigin: true },
      server: { ssr: { mode: 'string' } },
    } as UserConfig);
    expect(links).toContain(
      '</static/js/async/about/page.js>; rel=preload; as=script; crossorigin',
    );
  });
});

describe('createRender early hints', () => {
  const monitors = {
    error() {},
    warn() {},
    info() {},
    debug() {},
    trace() {},
    timing() {},
    counter() {},
    push() {},
  } as unknown as Monitors;

  const run = async (
    config: UserConfig,
    url = 'http://localhost/user/1',
    entryName = 'main',
  ) => {
    const calls: string[][] = [];
    const order: string[] = [];
    const render = await createRender({
      routes: [{ ...route, entryName }],
      pwd: '',
      config,
    });
    const response = await render(new Request(url), {
      monitors,
      templates: { [`${entryName}-/`]: html },
      serverManifest: {
        ...serverManifest,
        renderBundles: {
          [entryName]: {
            requestHandler: () => {
              order.push('render');
              return new Response('SSR');
            },
          },
        },
        nestedRoutesJson: {
          [entryName]: (serverManifest.nestedRoutesJson as any).main,
        },
      } as unknown as ServerManifest,
      writeEarlyHints: links => {
        order.push('early-hints');
        calls.push(links);
      },
    });
    return { calls, order, response };
  };

  it('is off by default', async () => {
    const { calls } = await run({ server: { ssr: true } } as UserConfig);
    expect(calls).toEqual([]);
  });

  it('writes early hints before the SSR render when enabled', async () => {
    const { calls, order, response } = await run({
      server: { ssr: { earlyHints: true } },
    } as UserConfig);
    expect(order).toEqual(['early-hints', 'render']);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain(
      '</static/js/async/user/(id)/page.js>; rel=preload; as=script',
    );
    expect(await response.text()).toBe('SSR');
  });

  it('follows ssrByEntries', async () => {
    const config = {
      server: {
        ssr: true,
        ssrByEntries: { other: { earlyHints: true } },
      },
    } as UserConfig;
    expect((await run(config)).calls).toEqual([]);
    expect(
      (await run(config, 'http://localhost/user/1', 'other')).calls,
    ).toHaveLength(1);
  });

  it('does not write early hints for data requests or CSR', async () => {
    const config = {
      server: { ssr: { earlyHints: true } },
    } as UserConfig;
    expect(
      (await run(config, 'http://localhost/user/1?__loader=user/layout')).calls,
    ).toEqual([]);
    const csr = await createRender({
      routes: [{ ...route, isSSR: false }],
      pwd: '',
      config,
    });
    const calls: string[][] = [];
    await csr(new Request('http://localhost/'), {
      monitors,
      templates: { 'main-/': html },
      serverManifest,
      writeEarlyHints: links => calls.push(links),
    });
    expect(calls).toEqual([]);
  });

  it('keeps rendering when writing early hints throws', async () => {
    const render = await createRender({
      routes: [route],
      pwd: '',
      config: { server: { ssr: { earlyHints: true } } } as UserConfig,
    });
    const response = await render(new Request('http://localhost/user/1'), {
      monitors,
      templates: { 'main-/': html },
      serverManifest,
      writeEarlyHints: () => {
        throw new Error('not supported');
      },
    });
    expect(await response.text()).toBe('SSR');
  });
});
