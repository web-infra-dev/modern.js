import type { Monitors, ServerRoute } from '@modern-js/types';
import { getEarlyHintLinks } from '../../src/plugins/render/earlyHints';
import { createRender } from '../../src/plugins/render/render';
import type { ServerManifest } from '../../src/types';

const route: ServerRoute = {
  urlPath: '/',
  entryName: 'main',
  entryPath: 'main.html',
  isSPA: true,
  isSSR: true,
};

const critical = { h: '/critical.js', a: 'script', b: 1 };
const group = (
  id: string,
  ...files: { h: string; a: string; b: number; i?: string; l?: number }[]
) => ({ id, files });
const resourceStages = {
  version: 1,
  routeRule: true,
  budget: { size: 1024, requests: 8 },
  entries: { main: [critical] },
  earlyHints: { entries: ['main'], crossOriginLoading: 'anonymous' },
  routes: {
    'user/page': {
      declared: [
        group('user', {
          h: 'https://cdn.example.com/user.css',
          a: 'style',
          b: 1,
        }),
        group('entry', critical),
        group('signed', {
          h: '/signed.js',
          a: 'script',
          i: 'sha384-test',
          b: 1,
        }),
        group('invalid', { h: '/invalid>link.js', a: 'script', b: 1 }),
        group('large-header', { h: '/' + 'x'.repeat(5000), a: 'script', b: 1 }),
      ],
      own: [group('route', { h: '/route.js', a: 'script', l: 1, b: 1 })],
      rs: { visible: ['late-shared'] },
      s: { idle: ['idle'] },
    },
    'about/page': {
      declared: [group('about', { h: '/about.js', a: 'script', b: 1 })],
    },
  },
};

const manifest: ServerManifest = {
  nestedRoutesJson: {
    main: [
      { id: 'user/page', path: '/user/:id' },
      { id: 'about/page', path: '/about' },
    ],
  },
  routeManifest: {
    resourceStages,
    routeAssets: { 'user/page': { assets: ['/not-staged.js'] } },
  },
};

const userPage = new Request('http://localhost/user/1');
const entryLink = '</critical.js>; rel=preload; as=script';
const routeLink = '</route.js>; rel=preload; as=script; fetchpriority=low';
const cssLink =
  '<https://cdn.example.com/user.css>; rel=preload; as=style; crossorigin=anonymous';

describe('staged Early Hints', () => {
  it('hints eligible critical assets from the entry and matched route', () => {
    expect(
      getEarlyHintLinks(userPage, {
        routeInfo: route,
        serverManifest: manifest,
        config: {},
      }),
    ).toEqual([entryLink, cssLink, routeLink]);
  });

  it.each([
    [{ mode: 'string' }, true],
    [true, false],
  ] as const)('keeps the route JS rule out of %j (%j)', (ssr, routeRule) => {
    expect(
      getEarlyHintLinks(userPage, {
        routeInfo: route,
        serverManifest: {
          ...manifest,
          routeManifest: { resourceStages: { ...resourceStages, routeRule } },
        },
        config: { server: { ssr } },
      }),
    ).toEqual([entryLink, cssLink]);
  });

  it('shares the route preload budget with the entry', () => {
    expect(
      getEarlyHintLinks(userPage, {
        routeInfo: route,
        serverManifest: {
          ...manifest,
          routeManifest: {
            resourceStages: {
              ...resourceStages,
              budget: { size: 1024, requests: 2 },
            },
          },
        },
        config: {},
      }),
    ).toEqual([entryLink, cssLink]);
  });

  it('skips the hints if the build did not opt in or the entry has no plan', () => {
    const { earlyHints: _earlyHints, ...disabled } = resourceStages;
    expect(
      getEarlyHintLinks(userPage, {
        routeInfo: route,
        config: {},
        serverManifest: {
          ...manifest,
          routeManifest: { resourceStages: disabled },
        },
      }),
    ).toEqual([]);
    expect(
      getEarlyHintLinks(userPage, {
        routeInfo: { ...route, entryName: 'other' },
        serverManifest: manifest,
        config: {},
      }),
    ).toEqual([]);
  });

  const renderPage = async ({
    request = userPage,
    forceCSR = false,
    writeEarlyHints,
  }: {
    request?: Request;
    forceCSR?: boolean;
    writeEarlyHints?: (links: string[]) => void;
  }) => {
    const order: string[] = [];
    const render = await createRender({
      routes: [route],
      pwd: '',
      config: {},
      forceCSR,
    });
    const response = await render(request, {
      monitors: {
        error() {},
        timing() {},
        warn() {},
        counter() {},
      } as unknown as Monitors,
      templates: { 'main-/': '<html></html>' },
      serverManifest: {
        ...manifest,
        renderBundles: {
          main: {
            requestHandler: Promise.resolve(() => {
              order.push('render');
              return new Response('SSR');
            }),
          },
        },
      },
      writeEarlyHints: writeEarlyHints
        ? links => {
            order.push('hints');
            writeEarlyHints(links);
          }
        : undefined,
    });
    return { response, order };
  };

  it('sends hints before rendering and keeps the final response on write failure', async () => {
    const { response, order } = await renderPage({
      writeEarlyHints: rstest.fn(() => {
        throw new Error('write failed');
      }),
    });
    expect(order).toEqual(['hints', 'render']);
    expect(await response.text()).toBe('SSR');
  });

  it('renders without hints when the platform has no writer', async () => {
    const { response, order } = await renderPage({});
    expect(order).toEqual(['render']);
    expect(await response.text()).toBe('SSR');
  });

  it('skips hints for requests on the SSR route that render on the client', async () => {
    const writeEarlyHints = rstest.fn();
    await renderPage({
      request: new Request('http://localhost/user/1?csr=1'),
      forceCSR: true,
      writeEarlyHints,
    });
    expect(writeEarlyHints).not.toHaveBeenCalled();
  });
});
