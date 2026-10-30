import React, { useState } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  createBrowserRouter,
  createHashRouter,
} from '@modern-js/runtime-utils/router';
import { createScopedRoot } from '../../src/core/react/scope';
import { createRuntime, registerPlugin } from '../../src/core/plugin';
import { createRoot } from '../../src/core/react';
import { setGlobalContext } from '../../src/core/context';
import { routerPlugin } from '../../src/router/runtime/plugin';
import {
  createBrowserRouterConnector,
  createMountWindow,
} from '../../src/mf/navigation';

const { routing } = rstest.hoisted(() => ({
  routing: { current: undefined as any },
}));
rstest.mock('@module-federation/bridge-react/base', () => ({
  ...rstest.requireActual('@module-federation/bridge-react/base'),
  useBridgeRouter: () => routing.current,
}));
const originalURL = window.location.href;
beforeEach(() => {
  routing.current = { memoryRoute: { entryPath: '/' } };
  window.history.replaceState(null, '', '/');
});
afterEach(() => window.history.replaceState(null, '', originalURL));

it.each([true, false])(
  'owns separate contexts and state across two mounts (independent memory: %s)',
  async memory => {
    if (!memory) routing.current = undefined;
    const hostData = window._ROUTER_DATA;
    window._ROUTER_DATA = {
      loaderData: { root: 'Host data must not leak' },
      errors: null,
    };
    const requests: string[] = [];
    const initialized = rstest.fn();
    function Layout({ label }: { label: string }) {
      const [count, setCount] = useState(0);
      const data = useLoaderData() as string;
      return (
        <section>
          <h2>{label}</h2>
          <p>{data}</p>
          <button onClick={() => setCount(value => value + 1)}>
            Count {count}
          </button>
          <Link to="detail/42">Detail</Link>
          <Outlet />
        </section>
      );
    }
    const Root = createScopedRoot({
      selected: true,
      dataRoute: '/product',
      basename: '/',
      serverLoaders: false,
      getDataBase: () => 'http://producer',
      routes: [
        {
          id: 'root',
          type: 'nested',
          origin: 'file-system',
          isRoot: true,
          path: '/',
          component: Layout,
          loader: () => 'ancestor loader',
          children: [
            {
              id: 'product',
              type: 'nested',
              origin: 'file-system',
              path: '/',
              component: () => <Outlet />,
              children: [
                {
                  id: 'list',
                  type: 'nested',
                  origin: 'file-system',
                  index: true,
                  component: () => <p>List</p>,
                },
                {
                  id: 'detail',
                  type: 'nested',
                  origin: 'file-system',
                  path: 'detail/:id',
                  loader: ({ request }: { request: Request }) => {
                    requests.push(request.url);
                    return null;
                  },
                  component: () => {
                    const location = useLocation();
                    return <p>Detail page {location.pathname}</p>;
                  },
                },
              ],
            },
          ],
        },
      ],
      createRuntime: config =>
        createRuntime([
          routerPlugin({}, config),
          {
            name: 'observe',
            setup(api) {
              api.onBeforeRender(initialized);
            },
          },
        ]),
    });
    const first = render(<Root label="First" />);
    const second = render(<Root label="Second" />);
    try {
      await waitFor(() =>
        expect(first.container.textContent).toContain('List'),
      );
      await waitFor(() =>
        expect(second.container.textContent).toContain('List'),
      );
      fireEvent.click(first.container.querySelector('button')!);
      fireEvent.click(first.container.querySelector('a')!);
      await waitFor(() =>
        expect(first.container.textContent).toContain('Detail page'),
      );
      expect(second.container.textContent).toContain(
        memory ? 'List' : 'Detail page',
      );
      expect(second.container.textContent).toContain('Count 0');
      first.rerender(<Root label="Updated" />);
      await waitFor(() =>
        expect(first.container.textContent).toContain('Updated'),
      );
      expect(first.container.textContent).toContain('Count 1');
      expect(first.container.textContent).toContain('ancestor loader');
      expect(first.container.textContent).not.toContain(
        'Host data must not leak',
      );
      expect(first.container.textContent).toContain('Detail page');
      expect(initialized).toHaveBeenCalledTimes(2);
      expect(requests).toHaveLength(memory ? 1 : 2);
      expect(new URL(requests[0]).pathname).toBe('/detail/42');
      expect(first.container.textContent).toContain('Detail page /detail/42');
      expect(first.container.textContent).not.toContain('/product');
    } finally {
      first.unmount();
      second.unmount();
      window._ROUTER_DATA = hostData;
    }
  },
);

it('keeps legacy component, memo, null and whole-application calls compatible', () => {
  const App = () => <p>Legacy app</p>;
  const Memo = React.memo(App);
  setGlobalContext({ App });
  registerPlugin([]);
  expect(createRoot()).toBe(App);
  expect(createRoot(undefined)).toBe(App);
  expect(createRoot(null)).toBe(App);
  expect(createRoot({})).toBe(App);
  expect(createRoot(App)).toBe(App);
  expect(createRoot(Memo)).toBe(Memo);
  expect(() => createRoot({ route: '/product' })).toThrow('statically defined');
});

it('aborts only the unmounted instance loader', async () => {
  const signals: AbortSignal[] = [];
  const Root = createScopedRoot({
    selected: true,
    dataRoute: '/product',
    basename: '/',
    serverLoaders: false,
    getDataBase: () => 'http://producer',
    routes: [
      {
        id: 'product',
        type: 'nested',
        origin: 'config',
        path: '/',
        component: () => <p>Product</p>,
        loader: ({ request }: { request: Request }) =>
          new Promise(resolve => {
            signals.push(request.signal);
            request.signal.addEventListener('abort', () => resolve(null), {
              once: true,
            });
          }),
      },
    ],
    createRuntime: (config, selected) =>
      createRuntime([routerPlugin({}, config, selected)]),
  });
  const first = render(<Root />);
  const second = render(<Root />);
  try {
    await waitFor(() => expect(signals).toHaveLength(2));
    first.unmount();
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  } finally {
    first.unmount();
    second.unmount();
  }
});

it.each(['', '/producer'])(
  'keeps server loader source URLs with basename %s separate from local route locations and client loaders',
  async producerBase => {
    const serverRequests: Request[] = [];
    const clientRequests: Request[] = [];
    function Layout() {
      return (
        <>
          <Link to="detail/a%2Fb?tab=stock#summary">Detail</Link>
          <Outlet />
        </>
      );
    }
    function Detail() {
      const location = useLocation();
      const data = useLoaderData() as { id: string };
      return (
        <p>
          {location.pathname}
          {location.search}
          {location.hash} id={data.id}
        </p>
      );
    }
    const Root = createScopedRoot({
      selected: true,
      dataRoute: '/product',
      basename: producerBase,
      serverLoaders: true,
      getDataBase: () => 'https://producer.example',
      routes: [
        {
          id: 'root',
          type: 'nested',
          origin: 'config',
          isRoot: true,
          component: Layout,
          loader: ({ request }: { request: Request }) => {
            serverRequests.push(request);
            return null;
          },
          children: [
            {
              id: 'product',
              type: 'nested',
              origin: 'config',
              path: '/',
              clientData: true,
              component: Outlet,
              loader: ({ request }: { request: Request }) => {
                clientRequests.push(request);
                return null;
              },
              children: [
                {
                  id: 'product/detail/($id)',
                  type: 'nested',
                  origin: 'config',
                  path: 'detail/:id',
                  component: Detail,
                  loader: ({
                    request,
                    params,
                  }: {
                    request: Request;
                    params: { id: string };
                  }) => {
                    serverRequests.push(request);
                    return { id: params.id };
                  },
                },
              ],
            },
          ],
        },
      ],
      createRuntime: (config, selected) =>
        createRuntime([routerPlugin({}, config, selected)]),
    });
    const view = render(<Root />);
    try {
      await waitFor(() =>
        expect(view.container.querySelector('a')).not.toBeNull(),
      );
      expect(serverRequests[0].url).toBe(
        `https://producer.example${producerBase}/product`,
      );
      expect(new URL(clientRequests[0].url).pathname).toBe('/');
      fireEvent.click(view.container.querySelector('a')!);
      await waitFor(() =>
        expect(view.container.textContent).toContain(
          '/detail/a%2Fb?tab=stock#summary id=a/b',
        ),
      );
      expect(serverRequests.at(-1)!.url).toBe(
        `https://producer.example${producerBase}/product/detail/a%2Fb?tab=stock`,
      );
      expect(new URL(clientRequests.at(-1)!.url).pathname).toBe(
        '/detail/a%2Fb',
      );
      expect(view.container.textContent).not.toContain('/product');
    } finally {
      view.unmount();
    }
  },
);

it.each([
  { html5: true, uppercase: false, baseElement: false },
  { html5: false, uppercase: false, baseElement: false },
  { html5: true, uppercase: true, baseElement: false },
  { html5: false, uppercase: false, baseElement: true },
])(
  'preserves a dynamic mount with history configuration %j',
  async ({ html5, uppercase, baseElement }) => {
    const initial = '/admin/stores/100/inventory';
    const next = '/admin/stores/200/inventory';
    const physical = (path: string) => (html5 ? path : '/#' + path);
    window.history.replaceState(
      null,
      '',
      physical(
        (uppercase ? initial.toUpperCase() : initial) +
          '/detail/42?tab=stock#summary',
      ),
    );
    const base = document.createElement('base');
    if (baseElement) {
      base.href = '/';
      document.head.append(base);
    }
    const requests: Request[] = [];
    const initialized = rstest.fn();
    const listeners = new Set<() => void>();
    let hostLocation = initial + '/detail/42?tab=stock#summary';
    const hostNavigate = rstest.fn();
    routing.current = {
      navigation: {
        getLocation: () => hostLocation,
        createHref: (href: string) => (html5 ? href : '#' + href),
        subscribe: (listener: () => void) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        navigate: hostNavigate,
      },
    };
    function Layout() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button onClick={() => setCount(count + 1)}>Count {count}</button>
          <Link to="detail/43?tab=next#forecast">Next</Link>
          <Outlet />
        </>
      );
    }
    function Detail() {
      const location = useLocation();
      return (
        <p>
          {location.pathname}
          {location.search}
          {location.hash}
        </p>
      );
    }
    const Root = createScopedRoot({
      selected: true,
      dataRoute: '/product',
      basename: '/producer',
      serverLoaders: true,
      getDataBase: () => 'https://producer.example',
      routes: [
        {
          id: 'root',
          type: 'nested',
          origin: 'config',
          isRoot: true,
          path: '/',
          component: Layout,
          children: [
            {
              id: 'redirect',
              type: 'nested',
              origin: 'config',
              path: 'redirect',
              loader: () =>
                new Response(null, {
                  status: 302,
                  headers: { Location: '/detail/99' },
                }),
            },
            {
              id: 'detail',
              type: 'nested',
              origin: 'config',
              path: 'detail/:id',
              component: Detail,
              loader: ({ request }: { request: Request }) => {
                requests.push(request);
                return null;
              },
            },
          ],
        },
      ],
      createRuntime: (config, selected) =>
        createRuntime([
          routerPlugin({ supportHtml5History: html5 }, config, selected),
          {
            name: 'observe',
            setup(api) {
              api.onBeforeRender(initialized);
            },
          },
        ]),
    });
    const view = render(<Root basename={initial} />);
    try {
      await waitFor(() =>
        expect(view.container.textContent).toContain(
          '/detail/42?tab=stock#summary',
        ),
      );
      expect(requests[0].url).toBe(
        'https://producer.example/producer/product/detail/42?tab=stock',
      );
      expect(view.container.querySelector('a')!.getAttribute('href')).toBe(
        (baseElement ? window.location.href.split('#')[0] : '') +
          (html5 ? '' : '#') +
          initial +
          '/detail/43?tab=next#forecast',
      );
      fireEvent.click(view.container.querySelector('button')!);
      const historySize = window.history.length;
      fireEvent.click(view.container.querySelector('a')!);
      await waitFor(() =>
        expect(view.container.textContent).toContain(
          '/detail/43?tab=next#forecast',
        ),
      );
      expect(window.history.length).toBe(historySize + 1);
      expect(requests).toHaveLength(2);
      expect(window.location.href).toContain(
        physical(initial + '/detail/43?tab=next#forecast'),
      );
      expect(hostNavigate).not.toHaveBeenCalled();
      window.history.pushState(
        null,
        '',
        physical(next + '/detail/42?tab=stock#summary'),
      );
      hostLocation = next + '/detail/42?tab=stock#summary';
      view.rerender(<Root basename={next} label="updated" />);
      await waitFor(() =>
        expect(view.container.textContent).toContain(
          '/detail/42?tab=stock#summary',
        ),
      );
      expect(view.container.textContent).toContain('Count 1');
      expect(initialized).toHaveBeenCalledTimes(1);
      fireEvent.click(view.container.querySelector('a')!);
      await waitFor(() =>
        expect(window.location.href).toContain(
          physical(next + '/detail/43?tab=next#forecast'),
        ),
      );
      expect(requests.at(-1)!.url).toBe(
        'https://producer.example/producer/product/detail/43?tab=next',
      );
      const router = initialized.mock.calls[0][0]._routeScope.router;
      await act(async () => {
        await router.navigate('/redirect');
      });
      await waitFor(() =>
        expect(view.container.textContent).toContain('/detail/99'),
      );
      expect(window.location.href).toContain(physical(next + '/detail/99'));
      expect(view.container.textContent).toContain('Count 1');
      expect(initialized.mock.calls[0][0]._routeScope.router).toBe(router);
      const notified = rstest.fn();
      window.addEventListener('popstate', notified);
      const beforeReplace = window.history.length;
      try {
        await act(async () => {
          await router.navigate('/detail/99', {
            replace: true,
            state: { marker: 'same-url' },
          });
        });
        expect(notified).toHaveBeenCalledTimes(1);
        expect(window.history.length).toBe(beforeReplace);
        expect(window.history.state.usr).toEqual({ marker: 'same-url' });
      } finally {
        window.removeEventListener('popstate', notified);
      }
      expect(listeners.size).toBe(1);
    } finally {
      view.unmount();
      base.remove();
    }
    expect(listeners.size).toBe(0);
  },
);

it.each(
  ['/outside', '/inventory/detail/42'].flatMap(target =>
    ['push', 'replace', 'back'].map(action => ({ target, action })),
  ),
)(
  'cancels pending remote navigation after a Host move (%j)',
  async ({ target, action }) => {
    const initial = '/inventory/detail/42';
    window.history.replaceState(null, '', action === 'back' ? target : initial);
    const host = createBrowserRouter([{ path: '*' }]);
    if (action === 'back') await host.navigate(initial);
    const listeners = new Set<() => void>();
    routing.current = {
      navigation: {
        getLocation: () => host.state.location.pathname,
        createHref: (to: string) => to,
        subscribe: (listener: () => void) => {
          listeners.add(listener);
          const stop = host.subscribe(listener);
          return () => {
            stop();
            listeners.delete(listener);
          };
        },
        navigate: rstest.fn(),
      },
    };
    let release!: () => void;
    let signal!: AbortSignal;
    const initialized = rstest.fn();
    const Root = createScopedRoot({
      selected: true,
      dataRoute: '/product',
      basename: '/',
      serverLoaders: false,
      getDataBase: () => 'https://producer.example',
      routes: [
        {
          id: 'root',
          type: 'nested',
          origin: 'config',
          path: '/',
          component: Outlet,
          children: [
            {
              id: 'detail',
              type: 'nested',
              origin: 'config',
              path: 'detail/:id',
              component: () => <p>Detail</p>,
            },
            {
              id: 'slow',
              type: 'nested',
              origin: 'config',
              path: 'slow',
              loader: ({ request }: { request: Request }) =>
                new Promise(resolve => {
                  signal = request.signal;
                  release = () => resolve(null);
                }),
            },
          ],
        },
      ],
      createRuntime: (config, selected) =>
        createRuntime([
          routerPlugin({}, config, selected),
          {
            name: 'observe',
            setup(api) {
              api.onBeforeRender(initialized);
            },
          },
        ]),
    });
    const view = render(<Root basename="/inventory" />);
    let pending: Promise<void> | undefined;
    try {
      await waitFor(() => expect(view.container.textContent).toBe('Detail'));
      const router = initialized.mock.calls[0][0]._routeScope.router;
      act(() => {
        pending = router.navigate('/slow');
      });
      await waitFor(() => expect(signal).toBeDefined());
      const size = window.history.length;
      const previousKey = host.state.location.key;
      const published = new Promise<void>(resolve => {
        const stop = host.subscribe(state => {
          if (state.location.key === previousKey) return;
          // Resolve in the same Host notification turn, before the connector's
          // microtask. The old loader must still lose to this navigation.
          release();
          stop();
          resolve();
        });
      });
      await act(async () => {
        if (action === 'back') await host.navigate(-1);
        else await host.navigate(target, { replace: action === 'replace' });
        await published;
        await pending;
      });
      expect(signal.aborted).toBe(true);
      expect(window.location.pathname).toBe(target);
      expect(window.history.length).toBe(size + (action === 'push' ? 1 : 0));
      expect(host.state.location.key).not.toBe(previousKey);
      expect(initialized).toHaveBeenCalledTimes(1);
    } finally {
      release?.();
      await pending;
      view.unmount();
      host.dispose();
    }
    expect(listeners.size).toBe(0);
  },
);

it('notifies a Browser Host when the initial redirect finishes before the subscription', async () => {
  window.history.replaceState(null, '', '/inventory/start');
  const host = createBrowserRouter([{ path: '*' }]);
  const remote = createBrowserRouter(
    [
      {
        path: '/start',
        loader: () =>
          new Response(null, {
            status: 302,
            headers: { Location: '/detail/42' },
          }),
      },
      { path: '/detail/:id' },
    ],
    { basename: '/inventory' },
  );
  let stop: (() => void) | undefined;
  try {
    await waitFor(() =>
      expect(remote.state.location.pathname).toBe('/inventory/detail/42'),
    );
    expect(host.state.location.pathname).toBe('/inventory/start');
    const size = window.history.length;
    const push = rstest.spyOn(window.history, 'pushState');
    const replace = rstest.spyOn(window.history, 'replaceState');
    try {
      const connection = createBrowserRouterConnector(
        {
          getLocation: () => host.state.location.pathname,
          createHref: to => to,
          subscribe: listener => host.subscribe(listener),
          navigate: rstest.fn(),
        },
        error => {
          throw error;
        },
      );
      connection.attach(remote);
      stop = connection.dispose;
      await waitFor(() =>
        expect(host.state.location.pathname).toBe('/inventory/detail/42'),
      );
      expect(window.history.length).toBe(size);
      expect(push).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    } finally {
      push.mockRestore();
      replace.mockRestore();
    }
  } finally {
    stop?.();
    remote.dispose();
    host.dispose();
  }
});

it('keeps an initial pending loader running when the Host has not navigated', async () => {
  window.history.replaceState(null, '', '/inventory');
  const listeners = new Set<() => void>();
  routing.current = {
    navigation: {
      getLocation: () => '/inventory',
      createHref: (to: string) => to,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      navigate: rstest.fn(),
    },
  };
  const requests: Request[] = [];
  let release!: () => void;
  const Root = createScopedRoot({
    selected: true,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => 'https://producer.example',
    routes: [
      {
        id: 'root',
        type: 'nested',
        origin: 'config',
        path: '/',
        component: () => <p>Ready</p>,
        loader: ({ request }: { request: Request }) =>
          new Promise(resolve => {
            requests.push(request);
            release = () => resolve(null);
          }),
      },
    ],
    createRuntime: (config, selected) =>
      createRuntime([routerPlugin({}, config, selected)]),
  });
  const view = render(<Root basename="/inventory" />);
  try {
    await waitFor(() => expect(listeners.size).toBe(1));
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests).toHaveLength(1);
    expect(requests[0].signal.aborted).toBe(false);
    await act(async () => release());
    await waitFor(() => expect(view.container.textContent).toBe('Ready'));
  } finally {
    release?.();
    view.unmount();
  }
  expect(listeners.size).toBe(0);
});

it.each([
  { withAdapter: false, strict: false },
  { withAdapter: true, strict: false },
  { withAdapter: false, strict: true },
  { withAdapter: true, strict: true },
])(
  'notifies a browser-only Host before suspended Remote content commits (%j)',
  async ({ withAdapter, strict }) => {
    window.history.replaceState(null, '', '/inventory/start');
    const host = createBrowserRouter([{ path: '*' }]);
    const hostListeners = new Set<() => void>();
    routing.current = withAdapter
      ? {
          navigation: {
            getLocation: () => window.location.pathname,
            subscribe: (listener: () => void) => {
              hostListeners.add(listener);
              window.addEventListener('popstate', listener);
              return () => {
                hostListeners.delete(listener);
                window.removeEventListener('popstate', listener);
              };
            },
            navigate: rstest.fn(),
          },
        }
      : undefined;
    let release!: () => void;
    const App = React.lazy(
      () =>
        new Promise<{ default: React.ComponentType<React.PropsWithChildren> }>(
          resolve => {
            release = () => resolve({ default: ({ children }) => children });
          },
        ),
    );
    const requests = rstest.fn(() => null);
    const Root = createScopedRoot({
      selected: true,
      basename: '/',
      serverLoaders: false,
      getDataBase: () => 'https://producer.example',
      App,
      routes: [
        {
          id: 'start',
          type: 'nested',
          origin: 'config',
          path: '/start',
          loader: () =>
            new Response(null, {
              status: 302,
              headers: { Location: '/detail/42' },
            }),
        },
        {
          id: 'detail',
          type: 'nested',
          origin: 'config',
          path: '/detail/:id',
          loader: requests,
          component: () => <Link to="../detail/43">Detail</Link>,
        },
      ],
      createRuntime: (config, selected) =>
        createRuntime([routerPlugin({}, config, selected)]),
    });
    const content = (
      <React.Suspense fallback={<p>Loading Remote content</p>}>
        <Root basename="/inventory" />
      </React.Suspense>
    );
    const view = render(
      strict ? <React.StrictMode>{content}</React.StrictMode> : content,
    );
    try {
      await waitFor(() =>
        expect(window.location.pathname).toBe('/inventory/detail/42'),
      );
      expect(view.container.textContent).toContain('Loading Remote content');
      await waitFor(() =>
        expect(host.state.location.pathname).toBe('/inventory/detail/42'),
      );
      expect(requests).toHaveBeenCalledTimes(1);
      await act(async () => release());
      await waitFor(() => expect(view.container.textContent).toBe('Detail'));
      const previousRequests = requests.mock.calls.length;
      fireEvent.click(view.container.querySelector('a')!);
      await waitFor(() =>
        expect(host.state.location.pathname).toBe('/inventory/detail/43'),
      );
      expect(requests).toHaveBeenCalledTimes(previousRequests + 1);
    } finally {
      release?.();
      view.unmount();
      host.dispose();
    }
    expect(hostListeners.size).toBe(0);
  },
);

it('aborts a suspended instance and discards a late initial redirect on unmount', async () => {
  window.history.replaceState(null, '', '/inventory/start');
  routing.current = undefined;
  let request!: Request;
  let release!: () => void;
  const App = React.lazy(() => new Promise<never>(() => {}));
  const Root = createScopedRoot({
    selected: true,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => 'https://producer.example',
    App,
    routes: [
      {
        id: 'start',
        type: 'nested',
        origin: 'config',
        path: '/start',
        loader: (args: { request: Request }) =>
          new Promise(resolve => {
            request = args.request;
            release = () =>
              resolve(
                new Response(null, {
                  status: 302,
                  headers: { Location: '/late' },
                }),
              );
          }),
      },
      {
        id: 'late',
        type: 'nested',
        origin: 'config',
        path: '/late',
        component: () => <p>Late</p>,
      },
    ],
    createRuntime: (config, selected) =>
      createRuntime([routerPlugin({}, config, selected)]),
  });
  const notified = rstest.fn();
  window.addEventListener('popstate', notified);
  const view = render(
    <React.Suspense fallback={<p>Loading Remote content</p>}>
      <Root basename="/inventory" />
    </React.Suspense>,
  );
  try {
    await waitFor(() => expect(request).toBeDefined());
    expect(view.container.textContent).toContain('Loading Remote content');
    const size = window.history.length;
    view.unmount();
    expect(request.signal.aborted).toBe(true);
    await act(async () => release());
    expect(window.location.pathname).toBe('/inventory/start');
    expect(window.history.length).toBe(size);
    expect(notified).not.toHaveBeenCalled();
  } finally {
    release?.();
    view.unmount();
    window.removeEventListener('popstate', notified);
  }
});

it('deduplicates pending native POPs by target URL and history key, but accepts new Host entries', async () => {
  window.history.replaceState(null, '', '/inventory');
  routing.current = undefined;
  const requests: Request[] = [];
  const releases: (() => void)[] = [];
  const Root = createScopedRoot({
    selected: true,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => 'https://producer.example',
    routes: [
      {
        id: 'home',
        type: 'nested',
        origin: 'config',
        path: '/',
        component: () => <p>Home</p>,
      },
      {
        id: 'slow',
        type: 'nested',
        origin: 'config',
        path: '/slow',
        loader: ({ request }: { request: Request }) =>
          new Promise(resolve => {
            requests.push(request);
            releases.push(() => resolve(null));
          }),
      },
      {
        id: 'outside',
        type: 'nested',
        origin: 'config',
        path: '*',
        component: () => null,
      },
    ],
    createRuntime: (config, selected) =>
      createRuntime([routerPlugin({}, config, selected)]),
  });
  const view = render(<Root basename="/inventory" />);
  const pop = () =>
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: window.history.state }),
    );
  try {
    await waitFor(() => expect(view.container.textContent).toBe('Home'));
    act(() => {
      window.history.pushState({ key: 'first' }, '', '/inventory/slow');
      pop();
    });
    await waitFor(() => expect(requests).toHaveLength(1));
    act(pop);
    expect(requests).toHaveLength(1);
    expect(requests[0].signal.aborted).toBe(false);
    act(() => {
      window.history.pushState({ key: 'second' }, '', '/inventory/slow');
      pop();
    });
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[0].signal.aborted).toBe(true);
    expect(requests[1].signal.aborted).toBe(false);
    act(() => {
      window.history.pushState({ key: 'outside' }, '', '/outside');
      pop();
    });
    expect(requests[1].signal.aborted).toBe(true);
    expect(window.location.pathname).toBe('/outside');
  } finally {
    await act(async () => {
      for (const release of releases) release();
    });
    view.unmount();
  }
});

it.each([true, false])(
  'reports mixed Host/Remote Router modes without writing history (Browser remote: %s)',
  async browser => {
    window.history.replaceState(null, '', '/inventory');
    const router = (browser ? createBrowserRouter : createHashRouter)([
      { path: '*' },
    ]);
    const errors = rstest.fn();
    const writes = rstest.spyOn(window.history, 'pushState');
    const connection = createBrowserRouterConnector(
      {
        getLocation: () => '/inventory',
        createHref: target => (browser ? '#' + target : target),
        subscribe: () => () => {},
        navigate: rstest.fn(),
      },
      errors,
      () => !browser,
    );
    connection.attach(router);
    try {
      await waitFor(() => expect(errors).toHaveBeenCalled());
      expect(errors.mock.calls[0][0].message).toContain(
        'Host and Remote must use the same Browser or Hash Router mode',
      );
      expect(writes).not.toHaveBeenCalled();
    } finally {
      connection.dispose();
      router.dispose();
      writes.mockRestore();
    }
  },
);

it.each([false, true])(
  'publishes a committed entry while the next navigation loads (Host adapter: %s)',
  async withAdapter => {
    window.history.replaceState(null, '', '/inventory');
    const host = createBrowserRouter([{ path: '*' }]);
    let remote: ReturnType<typeof createBrowserRouter> | undefined;
    let release: (() => void) | undefined;
    let pending: Promise<void> | undefined;
    const requests: Request[] = [];
    const mount = createMountWindow(
      '/inventory',
      () => '/inventory',
      () => remote,
      () => false,
    );
    remote = createBrowserRouter(
      [
        { path: '/' },
        { path: '/first' },
        {
          path: '/slow',
          loader: ({ request }) =>
            new Promise(resolve => {
              requests.push(request);
              release = () => resolve(null);
            }),
        },
      ],
      { basename: '/inventory', window: mount.window },
    );
    const connection = createBrowserRouterConnector(
      withAdapter
        ? {
            getLocation: () => host.state.location.pathname,
            subscribe: listener => host.subscribe(listener),
            createHref: target => target,
            navigate: rstest.fn(),
          }
        : undefined,
      error => {
        throw error;
      },
      () => false,
      mount.notifyPeers,
    );
    connection.attach(remote);
    try {
      await Promise.resolve();
      const size = window.history.length;
      // Both snapshots reach the connector before its queued notification runs.
      const first = remote.navigate('/first');
      pending = remote.navigate('/slow');
      await first;
      await waitFor(() =>
        expect(host.state.location.pathname).toBe('/inventory/first'),
      );
      expect(window.location.pathname).toBe('/inventory/first');
      expect(window.history.length).toBe(size + 1);
      expect(remote.state.location.pathname).toBe('/inventory/first');
      expect(remote.state.navigation.location?.pathname).toBe(
        '/inventory/slow',
      );
      expect(requests).toHaveLength(1);
      expect(requests[0].signal.aborted).toBe(false);
      release!();
      await pending;
      await waitFor(() =>
        expect(host.state.location.pathname).toBe('/inventory/slow'),
      );
      expect(window.history.length).toBe(size + 2);
    } finally {
      connection.dispose();
      remote.dispose();
      host.dispose();
      release?.();
      await pending;
    }
  },
);

it('keeps the next Remote loader running when a Host loader finishes echoing the prior entry', async () => {
  window.history.replaceState(null, '', '/inventory');
  let releaseHost: (() => void) | undefined;
  let releaseRemote: (() => void) | undefined;
  let pending: Promise<void> | undefined;
  const requests: Request[] = [];
  const host = createBrowserRouter([
    {
      path: '*',
      loader: ({ request }) => {
        if (new URL(request.url).pathname === '/inventory/first')
          return new Promise(resolve => {
            releaseHost = () => resolve(null);
          });
        return null;
      },
    },
  ]);
  let remote: ReturnType<typeof createBrowserRouter> | undefined;
  const mount = createMountWindow(
    '/inventory',
    () => '/inventory',
    () => remote,
    () => false,
  );
  remote = createBrowserRouter(
    [
      { path: '/' },
      { path: '/first' },
      {
        path: '/slow',
        loader: ({ request }) =>
          new Promise(resolve => {
            requests.push(request);
            releaseRemote = () => resolve(null);
          }),
      },
    ],
    { basename: '/inventory', window: mount.window },
  );
  const connection = createBrowserRouterConnector(
    {
      getLocation: () => host.state.location.pathname,
      subscribe: listener => host.subscribe(listener),
      createHref: target => target,
      navigate: rstest.fn(),
    },
    error => {
      throw error;
    },
    () => false,
    mount.notifyPeers,
  );
  connection.attach(remote);
  try {
    await waitFor(() => expect(host.state.initialized).toBe(true));
    await remote.navigate('/first');
    await waitFor(() =>
      expect(host.state.navigation.location?.pathname).toBe('/inventory/first'),
    );
    pending = remote.navigate('/slow');
    await waitFor(() => expect(requests).toHaveLength(1));
    releaseHost!();
    await waitFor(() =>
      expect(host.state.location.pathname).toBe('/inventory/first'),
    );
    expect(window.location.pathname).toBe('/inventory/first');
    expect(remote.state.navigation.location?.pathname).toBe('/inventory/slow');
    expect(requests[0].signal.aborted).toBe(false);
    releaseRemote!();
    await pending;
    await waitFor(() =>
      expect(host.state.location.pathname).toBe('/inventory/slow'),
    );
  } finally {
    connection.dispose();
    remote.dispose();
    host.dispose();
    releaseHost?.();
    releaseRemote?.();
    await pending;
  }
});
