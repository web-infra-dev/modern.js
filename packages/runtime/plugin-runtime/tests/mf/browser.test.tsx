import React, { useState } from 'react';
import {
  Link,
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  useLoaderData,
  useLocation,
  useNavigate,
} from '@modern-js/runtime-utils/router';
import { createBridgeComponent } from '@module-federation/bridge-react/v18';
import type { CreateReactRemoteOptions } from '@module-federation/bridge-react/base';
import { act, render as rtlRender, waitFor } from '@testing-library/react';
import { createRuntime } from '../../src/core/plugin';
import { createScopedRoot } from '../../src/core/react/scope';
import type { ScopedRootDefinition } from '../../src/core/react/scopeDefinition';
import { routerPlugin } from '../../src/router/runtime/plugin';
import { useMemoryRoute } from '../../src/router/runtime/memory';
import { hydrate, render } from '../../src/mf/callbacks';
import { createModernReactRemote } from '../../src/mf/remote';
import { APPLICATION_SNAPSHOT_PROTOCOL } from '../../src/application/constants';

const tick = () => new Promise(resolve => setTimeout(resolve, 20));

beforeEach(() => window.history.replaceState(null, '', '/inventory'));

it('hydrates the supplied scoped Root with loader data and keeps DOM, state and Router during prop updates', async () => {
  let loaderCalls = 0;
  function Page({ name }: { name: string }) {
    const data = useLoaderData() as { label: string };
    const [count, setCount] = useState(0);
    return (
      <button
        onClick={() => setCount(value => value + 1)}
      >{`${name}:${data.label}:${count}`}</button>
    );
  }
  const definition: ScopedRootDefinition = {
    routes: [
      {
        id: 'page',
        type: 'nested',
        isRoot: true,
        path: '/',
        component: Page,
        loader: () => {
          loaderCalls++;
          return { label: 'client' };
        },
      },
    ],
    selected: true,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => window.location.origin,
    createRuntime: (context, instancePlugins) =>
      createRuntime([routerPlugin({})], undefined, context, instancePlugins),
  };
  const Root = createScopedRoot(definition);
  const container = document.createElement('div');
  container.innerHTML =
    '<button>Lake:server:0</button><template id="inventory-shell"></template>';
  document.body.append(container);
  const original = container.firstElementChild as HTMLButtonElement;
  const hostData = { loaderData: { page: 'host' }, errors: null };
  window._ROUTER_DATA = hostData;
  const errors: unknown[] = [];
  const navigationListeners = new Set<() => void>();
  const root = await hydrate(<Root name="Lake" />, container, {
    rootComponent: Root,
    navigation: {
      getLocation: () => '/inventory',
      navigate: () => {},
      subscribe(listener) {
        navigationListeners.add(listener);
        return () => navigationListeners.delete(listener);
      },
    },
    snapshot: {
      protocol: APPLICATION_SNAPSHOT_PROTOCOL,
      reactVersion: React.version,
      identifierPrefix: 'inventory-',
      shellMarker: 'inventory-shell',
      pending: [],
      url: `${window.location.origin}/inventory`,
      basename: '/inventory',
      props: { name: 'Lake' },
      routerData: { loaderData: { page: { label: 'server' } }, errors: null },
    },
    updates: new ReadableStream({
      start(controller) {
        controller.close();
      },
    }),
    rootOptions: { onRecoverableError: error => errors.push(error) },
  });
  expect(container.firstElementChild).toBe(original);
  original.click();
  await tick();
  expect(original.textContent).toBe('Lake:server:1');
  expect(
    await render(<Root name="Hill" />, container, {
      rootComponent: Root,
      basename: '/inventory',
      name: 'Hill',
    }),
  ).toBe(root);
  await tick();
  expect(container.firstElementChild).toBe(original);
  expect(original.textContent).toBe('Hill:server:1');
  expect(navigationListeners.size).toBe(1);
  expect(loaderCalls).toBe(0);
  expect(window._ROUTER_DATA).toBe(hostData);
  expect(errors).toEqual([]);
  root.unmount();
  expect(navigationListeners.size).toBe(0);
  expect(container.innerHTML).toBe('');
  container.remove();
  delete window._ROUTER_DATA;
});

it('cancels initialization before commit and ignores its late completion after a replacement mounts', async () => {
  let release!: () => void;
  let entered!: () => void;
  const waiting = new Promise<void>(resolve => {
    release = resolve;
  });
  const started = new Promise<void>(resolve => {
    entered = resolve;
  });
  let calls = 0;
  const Root = createScopedRoot({
    routes: [],
    App: () => <p>replacement</p>,
    selected: false,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => window.location.origin,
    createRuntime: (context, instancePlugins) =>
      createRuntime(
        [
          {
            name: 'delayed-application-start',
            setup(api) {
              api.onBeforeRender(async () => {
                if (++calls === 1) {
                  entered();
                  await waiting;
                }
              });
            },
          },
        ],
        undefined,
        context,
        instancePlugins,
      ),
  });
  const container = document.createElement('div');
  document.body.append(container);
  const controller = new AbortController();
  const pending = render(<Root />, container, {
    rootComponent: Root,
    signal: controller.signal,
  });
  const cancelled = expect(pending).rejects.toThrow('unmounted');
  await started;
  controller.abort(new Error('unmounted'));
  await cancelled;
  const replacement = await render(<Root />, container, {
    rootComponent: Root,
  });
  expect(container.textContent).toBe('replacement');
  release();
  await tick();
  expect(container.textContent).toBe('replacement');
  expect(await render(<Root />, container, { rootComponent: Root })).toBe(
    replacement,
  );
  replacement.unmount();
  container.remove();
});

it('retains memory navigation and page state when Bridge updates ordinary props', async () => {
  function Page({ name }: { name: string }) {
    const [count, setCount] = useState(0);
    const location = useLocation();
    return (
      <main>
        <p>{`${name}:${location.pathname}:${count}`}</p>
        <button onClick={() => setCount(value => value + 1)}>Count</button>
        <Link to="/detail">Detail</Link>
      </main>
    );
  }
  const Root = createScopedRoot({
    routes: [
      {
        id: 'page',
        type: 'nested',
        isRoot: true,
        path: '/:page?',
        component: Page,
      },
    ],
    selected: true,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => window.location.origin,
    createRuntime: (context, instancePlugins) =>
      createRuntime([routerPlugin({})], undefined, context, instancePlugins),
  });
  const memoryRoute = { entryPath: '/' };
  const container = document.createElement('div');
  document.body.append(container);
  const root = await render(<Root name="Lake" />, container, {
    rootComponent: Root,
    memoryRoute,
    name: 'Lake',
  });
  await expect
    .poll(() => container.querySelector('p')?.textContent)
    .toBe('Lake:/:0');
  const original = container.querySelector('main');
  container.querySelector('button')!.click();
  await expect
    .poll(() => container.querySelector('p')?.textContent)
    .toBe('Lake:/:1');
  container.querySelector('a')!.click();
  await expect
    .poll(() => container.querySelector('p')?.textContent)
    .toBe('Lake:/detail:1');
  expect(
    await render(<Root name="Hill" />, container, {
      rootComponent: Root,
      memoryRoute,
      name: 'Hill',
    }),
  ).toBe(root);
  await expect
    .poll(() => container.querySelector('p')?.textContent)
    .toBe('Hill:/detail:1');
  expect(container.querySelector('main')).toBe(original);
  expect(window.location.pathname).toBe('/inventory');
  root.unmount();
  container.remove();
});

it('supports rich memoryRoute options (initialEntries, initialIndex, basename) and SSR redirect hydration in Bridge callbacks', async () => {
  let clientLoads = 0;
  function Layout() {
    const memory = useMemoryRoute();
    return (
      <section>
        <span data-testid="mem">{`${memory.enabled}:${memory.basename}`}</span>
        <Outlet />
      </section>
    );
  }
  function Home() {
    return <p data-testid="view">home</p>;
  }
  function Detail() {
    const location = useLocation();
    const navigate = useNavigate();
    const data = useLoaderData() as { item: string };
    return (
      <div>
        <p data-testid="view">{`${data.item}:${location.pathname}`}</p>
        <button type="button" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }
  const Root = createScopedRoot({
    routes: [
      {
        id: 'root',
        type: 'nested',
        isRoot: true,
        path: '/',
        component: Layout,
        children: [
          { id: 'home', type: 'nested', index: true, component: Home },
          {
            id: 'detail',
            type: 'nested',
            path: 'detail/:id',
            component: Detail,
            loader: ({ params }: any) => {
              clientLoads++;
              return { item: `client-${params.id}` };
            },
          },
        ],
      },
    ],
    selected: true,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => window.location.origin,
    createRuntime: (context, instancePlugins) =>
      createRuntime([routerPlugin({})], undefined, context, instancePlugins),
  });

  // Simulate hydrating from an SSR snapshot that redirected from /secret -> /detail/42
  // while host caller still passes the original memoryRoute ({ entryPath: '/secret' }).
  const container = document.createElement('div');
  container.innerHTML =
    '<section><span data-testid="mem">true:/shop</span><div><p data-testid="view">server-42:/detail/42</p><button type="button">Back</button></div></section><template id="shop-shell"></template>';
  document.body.append(container);
  const errors: unknown[] = [];

  const root = await hydrate(<Root />, container, {
    rootComponent: Root,
    memoryRoute: {
      entryPath: '/secret',
      basename: '/shop',
    },
    snapshot: {
      protocol: APPLICATION_SNAPSHOT_PROTOCOL,
      reactVersion: React.version,
      identifierPrefix: 'shop-',
      shellMarker: 'shop-shell',
      pending: [],
      url: `${window.location.origin}/shop/detail/42`,
      basename: '/shop',
      memoryRoute: {
        entryPath: '/shop/detail/42',
        initialEntries: ['/shop/', '/shop/detail/42'],
        initialIndex: 1,
        basename: '/shop',
      },
      props: {},
      routerData: {
        loaderData: { root: null, detail: { item: 'server-42' } },
        errors: null,
      },
    },
    updates: new ReadableStream({
      start(controller) {
        controller.close();
      },
    }),
    rootOptions: { onRecoverableError: error => errors.push(error) },
  });

  expect(errors).toEqual([]);
  expect(clientLoads).toBe(0);
  expect(container.querySelector('[data-testid="mem"]')?.textContent).toBe(
    'true:/shop',
  );
  expect(container.querySelector('[data-testid="view"]')?.textContent).toBe(
    'server-42:/detail/42',
  );

  // Back button navigates along the preserved initialEntries stack without mutating browser URL.
  container.querySelector('button')!.click();
  await expect
    .poll(() => container.querySelector('[data-testid="view"]')?.textContent)
    .toBe('home');
  expect(window.location.pathname).toBe('/inventory');

  root.unmount();
  container.remove();
});

it('decouples createModernReactRemote with memoryRoute from Host route context and basename changes', async () => {
  function Card({ title }: { title: string }) {
    const [count, setCount] = useState(0);
    return (
      <button
        type="button"
        data-testid="card"
        onClick={() => setCount(value => value + 1)}
      >
        {`${title}:${count}`}
      </button>
    );
  }
  const producer = createBridgeComponent({ rootComponent: Card });
  const factory = rstest.fn(() => producer());
  const loadRemote = rstest.fn(async () => ({ default: factory }));
  const instance = {
    registerPlugins: rstest.fn(),
    remoteHandler: {
      getLoadedRemoteInfo: () => ({
        id: 'cards/Card',
        isModule: true,
        recovered: false,
        remoteMatchInfo: {
          expose: './Card',
          remoteSnapshot: {
            modules: [{ modulePath: './Card', render: 'bridge' }],
          },
        },
      }),
    },
  } as unknown as NonNullable<CreateReactRemoteOptions['instance']>;

  const MemoryCard = createModernReactRemote({
    remote: loadRemote,
    instance,
    memoryRoute: { entryPath: '/card' },
  });

  // 1. Works outside any Modern route / Router context without throwing.
  let outsideView!: ReturnType<typeof rtlRender>;
  await act(async () => {
    outsideView = rtlRender(<MemoryCard title="Outside" />);
  });
  await waitFor(() =>
    expect(outsideView.getByTestId('card').textContent).toBe('Outside:0'),
  );
  await act(async () => outsideView.unmount());

  // 2. Inside a Modern route, changing the Host route does not remount or reset state.
  function HostShell() {
    const navigate = useNavigate();
    return (
      <div>
        <button
          type="button"
          data-testid="switch-store"
          onClick={() => navigate('/stores/200')}
        >
          Switch
        </button>
        <MemoryCard title="Inside" />
      </div>
    );
  }
  let routedView!: ReturnType<typeof rtlRender>;
  await act(async () => {
    routedView = rtlRender(
      <MemoryRouter initialEntries={['/stores/100']}>
        <Routes>
          <Route path="/stores/:id" element={<HostShell />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  await waitFor(() =>
    expect(routedView.getByTestId('card').textContent).toBe('Inside:0'),
  );
  act(() => routedView.getByTestId('card').click());
  expect(routedView.getByTestId('card').textContent).toBe('Inside:1');
  act(() => routedView.getByTestId('switch-store').click());
  await tick();
  // Factory was called twice total (once for outsideView, once for routedView) — NOT remounted on Host route change!
  expect(factory).toHaveBeenCalledTimes(2);
  expect(routedView.getByTestId('card').textContent).toBe('Inside:1');
  await act(async () => routedView.unmount());
});
