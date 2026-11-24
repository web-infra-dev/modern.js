import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from '@modern-js/runtime-utils/router';
import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import {
  InternalRuntimeContext,
  getInitialContext,
  setGlobalContext,
} from '../../src/core/context';
import { registerPlugin } from '../../src/core/plugin';
import { createRoot } from '../../src/core/react';
import {
  MemoryRouteProvider,
  normalizeMemoryRouterConfig,
  useMemoryRoute,
} from '../../src/router';
import { type RouterConfig, routerPlugin } from '../../src/router/internal';

const originalURL = window.location.href;

beforeEach(() => {
  window.history.replaceState(null, '', '/host-page?keep=1');
  delete (window as any)._ROUTER_DATA;
  delete (window as any)._SSR_DATA;
});

afterEach(() => {
  window.history.replaceState(null, '', originalURL);
  delete (window as any)._ROUTER_DATA;
  delete (window as any)._SSR_DATA;
});

function createBrowserApp(
  routes: any[],
  routerConfig: Partial<RouterConfig> = {},
) {
  setGlobalContext({ routes });
  const runtime = registerPlugin([routerPlugin(routerConfig)], {
    router: routerConfig,
  });
  const context = getInitialContext(true);
  runtime.pluginAPI.updateRuntimeContext(context);
  const Root = createRoot();
  return { Root, context, runtime };
}

describe('normalizeMemoryRouterConfig', () => {
  it('supports boolean, string, entryPath + initialState, and initialEntries + initialIndex + basename', () => {
    expect(normalizeMemoryRouterConfig(false)).toBeUndefined();
    expect(normalizeMemoryRouterConfig(undefined)).toBeUndefined();

    expect(normalizeMemoryRouterConfig(true, '/current?a=1#h')).toEqual({
      initialEntries: ['/current?a=1#h'],
      initialIndex: 0,
      activePath: '/current?a=1#h',
      basename: undefined,
      hasExplicitInitialEntry: false,
    });

    expect(normalizeMemoryRouterConfig('/detail/42', '/host', '/app')).toEqual({
      initialEntries: ['/app/detail/42'],
      initialIndex: 0,
      activePath: '/app/detail/42',
      basename: '/app',
      hasExplicitInitialEntry: true,
    });

    expect(
      normalizeMemoryRouterConfig({
        entryPath: '/detail/42?tab=info#top',
        initialState: { from: 'card' },
        basename: '/app',
      }),
    ).toEqual({
      initialEntries: [
        {
          pathname: '/app/detail/42',
          search: '?tab=info',
          hash: '#top',
          state: { from: 'card' },
        },
      ],
      initialIndex: 0,
      activePath: '/app/detail/42?tab=info#top',
      basename: '/app',
      hasExplicitInitialEntry: true,
    });

    expect(
      normalizeMemoryRouterConfig({
        initialEntries: ['/home', '/detail/1', '/detail/2'],
        initialIndex: 1,
      }),
    ).toEqual({
      initialEntries: ['/home', '/detail/1', '/detail/2'],
      initialIndex: 1,
      activePath: '/detail/1',
      basename: undefined,
      hasExplicitInitialEntry: true,
    });
  });
});

describe('Modern.js memory router (config & API)', () => {
  it('supports config-driven router.memory with initialEntries, initialIndex, initialState, basename and loaders without mutating browser URL', async () => {
    function Layout() {
      const memory = useMemoryRoute();
      return (
        <main>
          <span data-testid="memory-enabled">{String(memory.enabled)}</span>
          <span data-testid="memory-basename">{memory.basename}</span>
          <Outlet />
        </main>
      );
    }

    function Home() {
      return (
        <div>
          <p data-testid="page">home</p>
          <Link to="/detail/99">Go 99</Link>
        </div>
      );
    }

    function Detail() {
      const location = useLocation();
      const navigate = useNavigate();
      const data = useLoaderData() as { id: string };
      return (
        <div>
          <p data-testid="page">
            detail:{data.id}:{location.pathname}
            {location.search}
            {location.hash}:{(location.state as any)?.from || 'none'}
          </p>
          <button type="button" onClick={() => navigate(-1)}>
            Back
          </button>
          <Link to="/detail/99?next=1">Next</Link>
        </div>
      );
    }

    const routes = [
      {
        id: 'root',
        type: 'nested',
        isRoot: true,
        path: '/',
        component: Layout,
        children: [
          {
            id: 'home',
            type: 'nested',
            index: true,
            component: Home,
          },
          {
            id: 'detail',
            type: 'nested',
            path: 'detail/:id',
            component: Detail,
            loader: ({ params }: any) => ({ id: params.id }),
          },
        ],
      },
    ];

    const { Root, context } = createBrowserApp(routes, {
      basename: '/shop',
      memory: {
        initialEntries: [
          '/',
          {
            pathname: '/detail/42',
            search: '?tab=specs',
            hash: '#top',
            state: { from: 'widget' },
          },
        ],
        initialIndex: 1,
      },
    });

    const view = render(
      <InternalRuntimeContext.Provider value={context}>
        <Root />
      </InternalRuntimeContext.Provider>,
    );

    await waitFor(() =>
      expect(view.getByTestId('page').textContent).toBe(
        'detail:42:/detail/42?tab=specs#top:widget',
      ),
    );
    expect(view.getByTestId('memory-enabled').textContent).toBe('true');
    expect(view.getByTestId('memory-basename').textContent).toBe('/shop');
    expect(window.location.pathname).toBe('/host-page');

    fireEvent.click(view.getByText('Back'));
    await waitFor(() =>
      expect(view.getByTestId('page').textContent).toBe('home'),
    );
    expect(window.location.pathname).toBe('/host-page');

    fireEvent.click(view.getByText('Go 99'));
    await waitFor(() =>
      expect(view.getByTestId('page').textContent).toBe(
        'detail:99:/detail/99:none',
      ),
    );
    expect(window.location.pathname).toBe('/host-page');
    expect(window.location.search).toBe('?keep=1');

    view.unmount();
  });

  it('supports API-driven MemoryRouteProvider and memoryRoute prop with full multi-instance isolation', async () => {
    function Page() {
      const location = useLocation();
      const memory = useMemoryRoute();
      return (
        <div>
          <p data-testid="loc">
            {location.pathname}:{String(memory.enabled)}
          </p>
          <Link to="/other">Other</Link>
        </div>
      );
    }

    const routes = [
      {
        id: 'root',
        type: 'nested',
        isRoot: true,
        path: '/:slug?',
        component: Page,
      },
    ];

    const { Root, context } = createBrowserApp(routes);

    const view = render(
      <InternalRuntimeContext.Provider value={context}>
        <section data-testid="a">
          <MemoryRouteProvider entryPath="/alpha">
            <Root />
          </MemoryRouteProvider>
        </section>
        <section data-testid="b">
          <Root memoryRoute="/beta" />
        </section>
      </InternalRuntimeContext.Provider>,
    );

    const sectionA = view.getByTestId('a');
    const sectionB = view.getByTestId('b');

    await waitFor(() =>
      expect(sectionA.querySelector('[data-testid="loc"]')?.textContent).toBe(
        '/alpha:true',
      ),
    );
    await waitFor(() =>
      expect(sectionB.querySelector('[data-testid="loc"]')?.textContent).toBe(
        '/beta:true',
      ),
    );

    fireEvent.click(sectionA.querySelector('a')!);
    await waitFor(() =>
      expect(sectionA.querySelector('[data-testid="loc"]')?.textContent).toBe(
        '/other:true',
      ),
    );
    expect(sectionB.querySelector('[data-testid="loc"]')?.textContent).toBe(
      '/beta:true',
    );
    expect(window.location.pathname).toBe('/host-page');

    view.unmount();
  });

  it('hydrates from serialized SSR _ROUTER_DATA in memory mode without re-running client loaders', async () => {
    let clientLoads = 0;

    function Page() {
      const location = useLocation();
      const memory = useMemoryRoute();
      const data = useLoaderData() as { item: string };
      return (
        <p data-testid="ssr-memory">
          {data.item}:{location.pathname}:{String(memory.enabled)}
        </p>
      );
    }

    const clientRoutes = [
      {
        id: 'detail',
        type: 'nested',
        isRoot: true,
        path: '/detail/:item',
        component: Page,
        loader: ({ params }: any) => {
          clientLoads++;
          return { item: `client-${params.item}` };
        },
      },
    ];

    const routerConfig: Partial<RouterConfig> = {
      memory: {
        initialEntries: ['/detail/first', '/detail/second'],
        initialIndex: 1,
      },
    };

    (window as any)._ROUTER_DATA = {
      loaderData: {
        detail: { item: 'server-second' },
      },
      errors: null,
    };

    const { Root, context } = createBrowserApp(clientRoutes, routerConfig);
    const view = render(
      <InternalRuntimeContext.Provider value={context}>
        <Root />
      </InternalRuntimeContext.Provider>,
    );

    await waitFor(() =>
      expect(view.getByTestId('ssr-memory').textContent).toBe(
        'server-second:/detail/second:true',
      ),
    );
    expect(clientLoads).toBe(0);
    expect(window.location.pathname).toBe('/host-page');

    view.unmount();
  });
});
