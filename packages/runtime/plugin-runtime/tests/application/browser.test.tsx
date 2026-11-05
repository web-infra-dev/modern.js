import {
  createPluginContract,
  contractGate,
  preparationEvents,
  disposalEvents,
} from './pluginContract';
import { render as renderPage } from '../../src/core/browser';
import { createRoot as createPageRoot } from '../../src/core/react';
import { setGlobalContext } from '../../src/core/context';
import { registerRuntimeDefinition } from '../../src/core/plugin';
import {
  Await,
  useLoaderData,
  useLocation,
  useRouteError,
} from '@modern-js/runtime-utils/router';
import React, { Suspense, useId, useState } from 'react';
import { renderApplication } from '../../src/application/server';
import { routerPlugin as nodeRouterPlugin } from '../../src/router/runtime/plugin.node';
import { createApplication as createScopedApplication } from '../../src/application';
import type { ScopedRootDefinition } from '../../src/core/react/scopeDefinition';
import { createRuntime } from '../../src/core/plugin';
import { APPLICATION_SNAPSHOT_PROTOCOL } from '../../src/application/constants';
import { useRuntimeContext } from '../../src/core/context/runtime';
import { routerPlugin } from '../../src/router/runtime/plugin';

let definition: ScopedRootDefinition;
function setDefinition({ routes }: { routes: any[]; entryName: string }) {
  definition = {
    routes,
    selected: false,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => window.location.origin,
    createRuntime: context =>
      createRuntime([routerPlugin({})], undefined, context),
  };
}
const createApplication = () =>
  createScopedApplication(undefined, { definition });
beforeEach(() => window.history.replaceState(null, '', '/'));
const closedUpdates = () =>
  new ReadableStream<unknown>({
    start(controller) {
      controller.close();
    },
  });

it('restores each application language before plugins run without borrowing Host data', async () => {
  const hostData = { data: { i18nData: { lng: 'host-language' } } };
  window._SSR_DATA = hostData as any;
  const languages: unknown[] = [];
  function Page() {
    const context = useRuntimeContext();
    return (
      <p>{String((context.__i18nData__ as any)?.lng || 'csr-language')}</p>
    );
  }
  definition = {
    routes: [],
    App: Page,
    selected: false,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => 'http://producer',
    createRuntime: context =>
      createRuntime(
        [
          {
            name: 'capture-application-language',
            setup(api) {
              api.onBeforeRender(context => {
                languages.push(context.__i18nData__);
              });
            },
          },
        ],
        undefined,
        context,
      ),
  };
  const apps = [createApplication(), createApplication(), createApplication()];
  const containers = ['en', 'zh', 'csr-language'].map((language, index) => {
    const container = document.createElement('div');
    container.innerHTML = `<p>${language}</p><template id="language-${index}-shell"></template>`;
    document.body.append(container);
    return container;
  });
  const paragraphs = containers.map(container => container.firstChild);
  const errors: unknown[] = [];
  try {
    for (const [index, lng] of ['en', 'zh'].entries()) {
      await apps[index].hydrate(
        containers[index],
        {
          protocol: APPLICATION_SNAPSHOT_PROTOCOL,
          reactVersion: React.version,
          identifierPrefix: `language-${index}-`,
          shellMarker: `language-${index}-shell`,
          pending: [],
          url: 'http://producer/',
          basename: '/',
          props: {},
          i18nData: { lng },
        },
        {
          updates: closedUpdates(),
          onRecoverableError: error => errors.push(error),
        },
      );
      expect(containers[index].firstChild).toBe(paragraphs[index]);
    }
    await apps[2].mount(containers[2], { url: 'http://producer/' });
    expect(languages).toEqual([{ lng: 'en' }, { lng: 'zh' }, undefined]);
    expect(containers.map(container => container.textContent)).toEqual([
      'en',
      'zh',
      'csr-language',
    ]);
    expect(errors).toEqual([]);
    expect(window._SSR_DATA).toBe(hostData);
  } finally {
    apps.forEach(app => app.destroy());
    containers.forEach(container => container.remove());
    delete window._SSR_DATA;
  }
});

it('mounts independent real routers without reading or replacing host hydration globals', async () => {
  const hostData = { loaderData: { page: 'host-state' }, errors: null };
  window._ROUTER_DATA = hostData;
  function Page({ title }: { title?: string }) {
    const data = useLoaderData() as { item: string };
    return (
      <p>
        {useLocation().pathname}:{data.item}
        {title}
      </p>
    );
  }
  setDefinition({
    entryName: 'index',
    routes: [
      {
        id: 'page',
        type: 'nested',
        isRoot: true,
        path: '/:item',
        component: Page,
        loader: ({ params }: any) => ({ item: params.item }),
      },
    ],
  });
  const a = document.createElement('div');
  const b = document.createElement('div');
  document.body.append(a, b);
  const first = createApplication();
  const second = createApplication();
  await Promise.all([
    first.mount(a, {
      url: 'http://example/apple',
      identifierPrefix: 'a-',
      memoryRoute: { entryPath: '/apple' },
    }),
    second.mount(b, {
      url: 'http://example/banana',
      identifierPrefix: 'b-',
      memoryRoute: { entryPath: '/banana' },
    }),
  ]);
  // The application commit may precede an asynchronous initial CSR loader.
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(a.textContent).toBe('/apple:apple');
  expect(b.textContent).toBe('/banana:banana');
  await first.update({ url: 'http://example/cherry' });
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(a.textContent).toBe('/cherry:cherry');
  expect(b.textContent).toBe('/banana:banana');
  await first.update({ props: { title: '-updated' } });
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(a.textContent).toBe('/cherry:cherry-updated');
  expect(b.textContent).toBe('/banana:banana');
  expect(window._ROUTER_DATA).toBe(hostData);
  first.destroy();
  second.destroy();
  expect(a.innerHTML).toBe('');
  expect(b.innerHTML).toBe('');
  a.remove();
  b.remove();
  delete window._ROUTER_DATA;
});

it('hydrates from the explicit snapshot and preserves the existing DOM', async () => {
  let loaderCalls = 0;
  function Page() {
    const data = useLoaderData() as { item: string };
    return <p>{data.item}</p>;
  }
  setDefinition({
    entryName: 'index',
    routes: [
      {
        id: 'page',
        type: 'nested',
        isRoot: true,
        path: '/',
        component: Page,
        loader: () => {
          loaderCalls++;
          return { item: 'incorrect-client-load' };
        },
      },
    ],
  });
  const container = document.createElement('div');
  container.innerHTML =
    '<p>server-product</p><template id="hydrated-shell"></template>';
  document.body.append(container);
  const paragraph = container.firstChild;
  const errors: unknown[] = [];
  const app = createApplication();
  await app.hydrate(
    container,
    {
      protocol: APPLICATION_SNAPSHOT_PROTOCOL,
      reactVersion: React.version,
      identifierPrefix: 'hydrated-',
      shellMarker: 'hydrated-shell',
      pending: [],
      url: 'http://example/',
      basename: '/',
      props: {},
      routerData: {
        loaderData: { page: { item: 'server-product' } },
        errors: null,
      },
    },
    {
      updates: closedUpdates(),
      onRecoverableError: error => {
        errors.push(error);
      },
    },
  );
  expect(container.firstChild).toBe(paragraph);
  expect(container.textContent).toBe('server-product');
  expect(loaderCalls).toBe(0);
  expect(errors).toEqual([]);
  app.destroy();
  container.remove();
});

it('restores a successful null server loader value and runs the client loader only on later navigation', async () => {
  let clientLoads = 0;
  function Page() {
    const data = useLoaderData() as { item: string } | null;
    return <p>{data === null ? 'server-null' : data.item}</p>;
  }
  setDefinition({
    entryName: 'index',
    routes: [
      {
        id: 'page',
        type: 'nested',
        isRoot: true,
        path: '/',
        component: Page,
        clientData: './page.data.client.ts',
        loader: () => {
          clientLoads++;
          return { item: 'client-navigation' };
        },
      },
    ],
  });
  const container = document.createElement('div');
  container.innerHTML =
    '<p>server-null</p><template id="null-shell"></template>';
  document.body.append(container);
  const paragraph = container.firstElementChild;
  const errors: unknown[] = [];
  const app = createApplication();
  try {
    await app.hydrate(
      container,
      {
        protocol: APPLICATION_SNAPSHOT_PROTOCOL,
        reactVersion: React.version,
        identifierPrefix: 'null-',
        shellMarker: 'null-shell',
        pending: [],
        url: window.location.href,
        basename: '/',
        props: {},
        routerData: { loaderData: { page: null }, errors: null },
      },
      {
        updates: closedUpdates(),
        onRecoverableError: error => errors.push(error),
      },
    );
    expect(container.firstElementChild).toBe(paragraph);
    expect(paragraph?.textContent).toBe('server-null');
    expect(clientLoads).toBe(0);
    window.history.pushState({ idx: 1, key: 'next' }, '', '/?next=1');
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: window.history.state }),
    );
    await expect.poll(() => paragraph?.textContent).toBe('client-navigation');
    expect(clientLoads).toBe(1);
    expect(container.firstElementChild).toBe(paragraph);
    expect(errors).toEqual([]);
  } finally {
    app.destroy();
    container.remove();
  }
});

it.each(['fulfilled', 'invalid-update', 'truncated', 'destroy'])(
  'hydrates controls before deferred data and handles late %s',
  async outcome => {
    let clientLoaderCalls = 0;
    function Counter() {
      const [count, setCount] = useState(0);
      return (
        <button onClick={() => setCount(value => value + 1)}>{count}</button>
      );
    }
    function Page() {
      const data = useLoaderData() as { pending: Promise<string> };
      return (
        <main>
          <Counter />
          <Suspense fallback={<p>waiting for statistics</p>}>
            <Await resolve={data.pending}>{value => <p>{value}</p>}</Await>
          </Suspense>
        </main>
      );
    }
    setDefinition({
      entryName: 'index',
      routes: [
        {
          id: 'page',
          type: 'nested',
          isRoot: true,
          path: '/',
          component: Page,
          loader: () => {
            clientLoaderCalls++;
            return { pending: Promise.resolve('unexpected client load') };
          },
        },
      ],
    });
    // A React streamed-shell fixture: the pending boundary is deliberately
    // incomplete while the button and the application shell marker are present.
    const shell =
      '<main><button>0</button><!--$?--><template id="early-browser-B:0"></template><p>waiting for statistics</p><!--/$--></main><template id="early-browser-shell"></template>';
    const initial = {
      protocol: APPLICATION_SNAPSHOT_PROTOCOL,
      reactVersion: React.version,
      identifierPrefix: 'early-browser-',
      shellMarker: 'early-browser-shell',
      url: 'http://products/',
      basename: '/',
      props: {},
      routerData: { loaderData: { page: { pending: null } }, errors: null },
      pending: [
        { id: '0', path: ['routerData', 'loaderData', 'page', 'pending'] },
      ],
    };
    let deliver!: ReadableStreamDefaultController<unknown>;
    const delayedUpdates = new ReadableStream({
      start(controller) {
        deliver = controller;
      },
    });
    const container = document.createElement('div');
    container.innerHTML = shell;
    document.body.append(container);
    const originalButton = container.querySelector('button')!;
    // The real document is still receiving the SSR response. React 19 treats a
    // pending boundary after DOMContentLoaded as an interrupted server render.
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });
    const errors: unknown[] = [];
    const app = createApplication();
    await app.hydrate(container, initial, {
      updates: delayedUpdates,
      onRecoverableError: error => errors.push(error),
    });
    expect(container.querySelector('button')).toBe(originalButton);
    originalButton.click();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(originalButton.textContent).toBe('1');
    expect(container.textContent).toContain('waiting for statistics');
    expect(clientLoaderCalls).toBe(0);
    expect(errors).toEqual([]);
    if (outcome === 'destroy') {
      app.destroy();
    } else {
      if (outcome !== 'truncated') {
        deliver.enqueue({
          id: outcome === 'invalid-update' ? 'unknown' : '0',
          status: 'fulfilled',
          value: 'later-statistics',
          pending: [],
        });
      }
      deliver.close();
    }
    await new Promise(resolve => setTimeout(resolve, 20));
    if (outcome === 'invalid-update') {
      expect(errors).toHaveLength(1);
      expect(String(errors[0])).toContain('Unknown or duplicate');
    } else if (outcome === 'truncated') {
      expect(errors).toHaveLength(1);
      expect(String(errors[0])).toContain(
        'ended before all deferred values settled',
      );
    } else {
      expect(errors).toEqual([]);
    }
    app.destroy();
    container.remove();
    Reflect.deleteProperty(document, 'readyState');
  },
);

it.each(['fragment', 'lazy fragment', 'in-flight Host navigation'])(
  'hydrates the server location before restoring %s without replacing the Router or DOM',
  async scenario => {
    const initialPath = '/inventory/detail/42?tab=stock';
    window.history.replaceState(
      { idx: 0, key: 'initial' },
      '',
      `${initialPath}#summary`,
    );
    function Page({ title }: { title?: string }) {
      const id = useId();
      const [count, setCount] = useState(0);
      const data = useLoaderData() as { product: string };
      const location = useLocation();
      return (
        <button id={id} onClick={() => setCount(value => value + 1)}>
          {`${title}:${data.product}:${location.pathname}${location.search}${location.hash}:${count}`}
        </button>
      );
    }
    const ServerPage = (props: { title?: string }) => (
      <Suspense fallback={<p>loading route</p>}>
        <Page {...props} />
      </Suspense>
    );
    let releasePage!: () => void;
    const LazyPage = React.lazy(
      () =>
        new Promise<{ default: typeof Page }>(resolve => {
          releasePage = () => resolve({ default: Page });
        }),
    );
    const ClientPage = (props: { title?: string }) => (
      <Suspense fallback={<p>loading route</p>}>
        <LazyPage {...props} />
      </Suspense>
    );
    let serverLoads = 0;
    const serverDefinition: ScopedRootDefinition = {
      routes: [
        {
          id: 'detail',
          type: 'nested',
          isRoot: true,
          path: '/detail/:id',
          component: ServerPage,
          loader: ({ params }: any) => {
            serverLoads++;
            return { product: params.id };
          },
        },
      ],
      selected: true,
      basename: '/',
      serverLoaders: false,
      getDataBase: () => window.location.origin,
      createRuntime: context =>
        createRuntime([nodeRouterPlugin({})], undefined, context),
    };
    const rendered = await renderApplication(
      new Request(`${window.location.origin}${initialPath}`),
      {
        definition: serverDefinition,
        basename: '/inventory',
        identifierPrefix: 'actual-',
        props: { title: 'server' },
      },
    );
    const html = await new Response(rendered.stream).text();
    const snapshot = await rendered.hydration.snapshot;
    expect(html).toContain('server:42:/detail/42?tab=stock:0');
    expect(serverLoads).toBe(1);
    let clientLoads = 0;
    let release!: () => void;
    let entered!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const started = new Promise<void>(resolve => {
      entered = resolve;
    });
    const routers: unknown[] = [];
    const initialLocations: unknown[] = [];
    definition = {
      ...serverDefinition,
      routes: serverDefinition.routes.map(route => ({
        ...route,
        component: scenario === 'lazy fragment' ? ClientPage : ServerPage,
        loader: ({ params }: any) => {
          clientLoads++;
          return { product: params.id };
        },
      })),
      createRuntime: context =>
        createRuntime(
          [
            routerPlugin({}),
            {
              name: 'observe-hydration-initialization',
              setup(api) {
                api.onBeforeRender(async context => {
                  const scope = context.application!;
                  const attach = scope.onRouterCreated!;
                  scope.onRouterCreated = router => {
                    routers.push(router);
                    initialLocations.push(router.state.location);
                    attach(router);
                  };
                  entered();
                  await gate;
                });
              },
            },
          ],
          undefined,
          context,
        ),
    };
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const button = container.querySelector('button')!;
    const id = button.id;
    const errors: unknown[] = [];
    const listeners = new Set<() => void>();
    const navigation = {
      getLocation: () =>
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      navigate: () => {},
      subscribe: rstest.fn((listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
    };
    const app = createApplication();
    const pending = app.hydrate(container, snapshot, {
      updates: rendered.hydration.updates,
      navigation,
      onRecoverableError: error => errors.push(error),
    });
    await started;
    expect(navigation.subscribe).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(1);
    if (scenario === 'in-flight Host navigation') {
      for (const value of [43, 44]) {
        window.history.pushState(
          { idx: value, key: `host-${value}` },
          '',
          `/inventory/detail/${value}?tab=host#latest`,
        );
        listeners.forEach(listener => listener());
        window.dispatchEvent(
          new PopStateEvent('popstate', { state: window.history.state }),
        );
      }
    }
    const push = rstest.spyOn(window.history, 'pushState');
    const replace = rstest.spyOn(window.history, 'replaceState');
    release();
    try {
      await pending;
      if (scenario === 'lazy fragment') {
        expect(button.textContent).toBe('server:42:/detail/42?tab=stock:0');
        releasePage();
      }
      const destination =
        scenario !== 'in-flight Host navigation'
          ? '42:/detail/42?tab=stock#summary'
          : '44:/detail/44?tab=host#latest';
      await expect
        .poll(() => button.textContent)
        .toBe(`server:${destination}:0`);
      expect(initialLocations).toEqual([
        expect.objectContaining({
          pathname: '/inventory/detail/42',
          search: '?tab=stock',
          hash: '',
          key: 'initial',
        }),
      ]);
      expect(routers).toHaveLength(1);
      expect(container.querySelector('button')).toBe(button);
      expect(button.id).toBe(id);
      expect(push).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
      expect(clientLoads).toBe(
        scenario !== 'in-flight Host navigation' ? 0 : 1,
      );
      button.click();
      await expect
        .poll(() => button.textContent)
        .toBe(`server:${destination}:1`);
      await app.update({ props: { title: 'updated' } });
      await expect
        .poll(() => button.textContent)
        .toBe(`updated:${destination}:1`);
      expect(routers).toHaveLength(1);
      expect(container.querySelector('button')).toBe(button);
      expect(errors).toEqual([]);
    } finally {
      push.mockRestore();
      replace.mockRestore();
      app.destroy();
      expect(listeners.size).toBe(0);
      container.remove();
    }
  },
);

it.each(['custom', 'default'])(
  'finishes initial location restoration when an SSR loader renders the %s error boundary',
  async boundary => {
    window.history.replaceState(
      { idx: 0, key: 'error-entry' },
      '',
      '/inventory#summary',
    );
    const ErrorPage = () => {
      const error = useRouteError() as Error;
      return (
        <p>
          {error.message}:{useLocation().hash}
        </p>
      );
    };
    const serverDefinition: ScopedRootDefinition = {
      routes: [
        {
          id: 'page',
          type: 'nested',
          isRoot: true,
          path: '/',
          component: () => <p>unreachable page</p>,
          ...(boundary === 'custom' ? { error: ErrorPage } : {}),
          loader: () => {
            throw new Error('loader failed');
          },
        },
      ],
      selected: true,
      basename: '/',
      serverLoaders: false,
      getDataBase: () => window.location.origin,
      createRuntime: context =>
        createRuntime([nodeRouterPlugin({})], undefined, context),
    };
    const rendered = await renderApplication(
      new Request(`${window.location.origin}/inventory`),
      {
        definition: serverDefinition,
        basename: '/inventory',
        identifierPrefix: 'error-',
      },
    );
    const html = await new Response(rendered.stream).text();
    const snapshot = await rendered.hydration.snapshot;
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const original = container.firstElementChild;
    let clientLoads = 0;
    let router:
      import('@modern-js/runtime-utils/router').DataRouter | undefined;
    definition = {
      ...serverDefinition,
      routes: serverDefinition.routes.map(route => ({
        ...route,
        loader: () => {
          clientLoads++;
          return null;
        },
      })),
      createRuntime: context =>
        createRuntime(
          [
            routerPlugin({}),
            {
              name: 'observe-error-router',
              setup(api) {
                api.onBeforeRender(context => {
                  const scope = context.application!;
                  const attach = scope.onRouterCreated!;
                  scope.onRouterCreated = value => {
                    router = value;
                    attach(value);
                  };
                });
              },
            },
          ],
          undefined,
          context,
        ),
    };
    const errors: unknown[] = [];
    const app = createApplication();
    try {
      await app.hydrate(container, snapshot, {
        updates: rendered.hydration.updates,
        onRecoverableError: error => errors.push(error),
      });
      await expect.poll(() => router?.state.location.hash).toBe('#summary');
      expect(container.firstElementChild).toBe(original);
      expect(clientLoads).toBe(0);
      expect(errors).toEqual([]);
      if (boundary === 'custom')
        await expect
          .poll(() => original?.textContent)
          .toBe('loader failed:#summary');
    } finally {
      app.destroy();
      container.remove();
    }
  },
);

it('releases a failed hydration snapshot so a fresh CSR instance can recover in the same container', async () => {
  let loaderCalls = 0;
  function Page({ title }: { title?: string }) {
    const data = useLoaderData() as { label: string };
    const [count, setCount] = useState(0);
    return (
      <button
        onClick={() => setCount(value => value + 1)}
      >{`${title}:${data.label}:${count}`}</button>
    );
  }
  setDefinition({
    entryName: 'index',
    routes: [
      {
        id: 'page',
        type: 'nested',
        path: '/',
        isRoot: true,
        component: Page,
        loader: () => {
          loaderCalls++;
          return { label: 'client recovery' };
        },
      },
    ],
  });
  const container = document.createElement('div');
  container.innerHTML = '<p>unfinished server content</p>';
  const serverNode = container.firstChild;
  document.body.append(container);
  let cancelled = false;
  const updates = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  const broken = createApplication();
  await expect(
    broken.hydrate(
      container,
      {
        protocol: APPLICATION_SNAPSHOT_PROTOCOL,
        reactVersion: React.version,
        identifierPrefix: 'broken-',
        shellMarker: 'broken-shell',
        url: window.location.href,
        basename: '/',
        props: {},
        routerData: { loaderData: {}, errors: null },
        pending: [
          { id: '0', path: ['routerData', 'loaderData', 'missing', 'value'] },
        ],
      },
      { updates },
    ),
  ).rejects.toThrow('Invalid application deferred data path');
  expect(cancelled).toBe(true);
  expect(loaderCalls).toBe(0);
  expect(container.firstChild).toBe(serverNode);
  const recovered = createApplication();
  await recovered.mount(container, {
    url: window.location.href,
    props: { title: 'Recovered' },
  });
  await new Promise(resolve => setTimeout(resolve, 20));
  const button = container.querySelector('button')!;
  expect(container.firstChild).not.toBe(serverNode);
  expect(button.textContent).toBe('Recovered:client recovery:0');
  expect(loaderCalls).toBe(1);
  button.click();
  await new Promise(resolve => setTimeout(resolve, 20));
  await recovered.update({ props: { title: 'Updated' } });
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(button.textContent).toBe('Updated:client recovery:1');
  recovered.destroy();
  expect(container.innerHTML).toBe('');
  container.remove();
});

async function mountContract(
  kind: 'page' | 'Bridge',
  probe: ReturnType<typeof createPluginContract>,
  container: HTMLElement,
) {
  const create = (context: any) =>
    createRuntime(probe.plugins, undefined, context);
  if (kind === 'page') {
    setGlobalContext({ App: probe.Page });
    registerRuntimeDefinition(create);
    const Root = createPageRoot();
    const root = await renderPage(<Root />, container);
    return () => root.unmount();
  }
  const app = createScopedApplication(undefined, {
    definition: {
      routes: [],
      App: probe.Page,
      selected: false,
      basename: '/',
      serverLoaders: false,
      getDataBase: () => window.location.origin,
      createRuntime: create,
    },
  });
  await app.mount(container, { url: window.location.href });
  return () => app.destroy();
}

it.each(['page', 'Bridge'] as const)(
  '%s executes the same awaited plugin contract and owns Provider data and cleanup',
  async kind => {
    delete window._SSR_DATA;
    delete window._ROUTER_DATA;
    const gate = contractGate();
    const probe = createPluginContract({ setupGate: gate.promise });
    const container = document.createElement('div');
    document.body.append(container);
    let dispose!: () => void;
    const pending = mountContract(kind, probe, container);
    await expect.poll(() => probe.records.length).toBe(1);
    expect(probe.records[0].events).toEqual(['setup:source']);
    expect(container.childElementCount).toBe(0);
    gate.release();
    dispose = await pending;
    await React.act(async () => {});
    const record = probe.records[0];
    expect(record.events).toEqual(preparationEvents);
    expect(record.provider).toBe(record.context);
    expect(record.publicData).toBe(record.context.contract);
    expect(
      container.querySelector('[data-contract-wrapper]')?.textContent,
    ).toBe(`contract:ready:${window.location.href}`);
    await React.act(async () => dispose());
    expect(record.events).toEqual([...preparationEvents, ...disposalEvents]);
    container.remove();
  },
);

it.each(['page', 'Bridge'] as const)(
  '%s provides decoded request queries throughout the shared plugin lifecycle',
  async kind => {
    delete window._SSR_DATA;
    delete window._ROUTER_DATA;
    window.history.replaceState(
      null,
      '',
      '/?encoded=a%20b&plus=a+b&token=a=b&flag&empty=&repeat=first&repeat=last&%E9%94%AE=%E5%80%BC',
    );
    const probe = createPluginContract({
      expectedQuery: {
        encoded: 'a b',
        plus: 'a b',
        token: 'a=b',
        flag: '',
        empty: '',
        repeat: 'last',
        键: '值',
      },
    });
    const container = document.createElement('div');
    document.body.append(container);
    let dispose: (() => void) | undefined;
    try {
      dispose = await mountContract(kind, probe, container);
      await React.act(async () => {});
      expect(probe.records[0].events).toEqual(preparationEvents);
      expect(probe.records[0].provider).toBe(probe.records[0].context);
    } finally {
      await React.act(async () => dispose?.());
      container.remove();
      window.history.replaceState(null, '', '/');
    }
  },
);

it.each(['page', 'Bridge'] as const)(
  '%s propagates plugin errors and interruption without mounting',
  async kind => {
    for (const options of [
      { error: new Error('plugin failed') },
      { interrupt: new Response('stop', { status: 409 }) },
      { interrupt: undefined },
    ]) {
      const probe = createPluginContract(options);
      const container = document.createElement('div');
      document.body.append(container);
      const pending = mountContract(kind, probe, container);
      await expect(pending).rejects.toBe(
        'error' in options ? options.error : options.interrupt,
      );
      expect(container.childElementCount).toBe(0);
      expect(probe.records[0].events).toEqual([
        ...preparationEvents.slice(0, 5),
        ...disposalEvents,
      ]);
      container.remove();
    }
  },
);

it('cancels pending Bridge plugin preparation without running later hooks or mounting', async () => {
  const gate = contractGate();
  const probe = createPluginContract({ hookGate: gate.promise });
  const container = document.createElement('div');
  document.body.append(container);
  const app = createScopedApplication(undefined, {
    definition: {
      routes: [],
      App: probe.Page,
      selected: false,
      basename: '/',
      serverLoaders: false,
      getDataBase: () => window.location.origin,
      createRuntime: context =>
        createRuntime(probe.plugins, undefined, context),
    },
  });
  const pending = app.mount(container, { url: window.location.href });
  await expect
    .poll(() => probe.records[0]?.events.includes('before:source'))
    .toBe(true);
  let rejection: unknown;
  const settled = pending.catch(error => {
    rejection = error;
  });
  try {
    app.destroy();
    await expect.poll(() => rejection).toBeInstanceOf(Error);
    expect((rejection as Error).message).toBe(
      'Application instance has been disposed',
    );
  } finally {
    gate.release();
    await settled;
  }
  await Promise.resolve();
  expect(container.childElementCount).toBe(0);
  expect(probe.records[0].events).toEqual([
    ...preparationEvents.slice(0, 5),
    ...disposalEvents,
  ]);
  container.remove();
});

it.each(['page', 'Bridge'] as const)(
  '%s unmounts its DOM and releases all plugins even when cleanup throws',
  async kind => {
    const probe = createPluginContract({
      cleanupError: new Error('cleanup failed'),
    });
    const container = document.createElement('div');
    document.body.append(container);
    const dispose = await mountContract(kind, probe, container);
    await React.act(async () => {});
    expect(container.querySelector('[data-contract-wrapper]')).not.toBeNull();
    await React.act(async () => {
      expect(dispose).toThrow();
    });
    expect(container.childElementCount).toBe(0);
    expect(probe.records[0].events).toEqual([
      ...preparationEvents,
      ...disposalEvents,
    ]);
    expect(dispose).not.toThrow();
    expect(probe.records[0].events).toEqual([
      ...preparationEvents,
      ...disposalEvents,
    ]);
    container.remove();
  },
);

it('keeps raw render props and avoids wrapRoot while registered roots use the wrapper once', async () => {
  const previousData = window._SSR_DATA;
  const previousReady = window._SSR_DATA_READY;
  delete window._SSR_DATA;
  delete window._SSR_DATA_READY;
  const wrappers: string[] = [];
  const cleanups: string[] = [];
  const prepared: string[] = [];
  function Page({ label }: { label: string }) {
    return <p>{label}</p>;
  }
  setGlobalContext({ App: Page });
  registerRuntimeDefinition(context =>
    createRuntime(
      [
        {
          name: 'raw-render-contract',
          setup(api) {
            api.onBeforeRender(() => {
              prepared.push('before');
            });
            api.wrapRoot(App => {
              wrappers.push('wrap');
              return props => (
                <section data-wrapped>
                  <App {...props} />
                </section>
              );
            });
            api.onDispose(() => {
              cleanups.push('dispose');
            });
          },
        },
      ],
      undefined,
      context,
    ),
  );
  const containers = [
    document.createElement('div'),
    document.createElement('div'),
  ];
  containers.forEach(container => document.body.append(container));
  const roots: Array<{ unmount(): void }> = [];
  try {
    await React.act(async () => {
      roots.push(await renderPage(<Page label="raw props" />, containers[0]));
    });
    expect(containers[0].textContent).toBe('raw props');
    expect(containers[0].querySelector('[data-wrapped]')).toBeNull();
    expect(wrappers).toEqual([]);
    const Root = createPageRoot();
    await React.act(async () => {
      roots.push(
        await renderPage(<Root label="registered props" />, containers[1]),
      );
    });
    expect(containers[1].querySelector('[data-wrapped]')?.textContent).toBe(
      'registered props',
    );
    expect(wrappers).toEqual(['wrap']);
    expect(prepared).toEqual(['before', 'before']);
  } finally {
    await React.act(async () => {
      roots.forEach(root => root.unmount());
    });
    containers.forEach(container => container.remove());
    window._SSR_DATA = previousData;
    window._SSR_DATA_READY = previousReady;
  }
  expect(cleanups).toEqual(['dispose', 'dispose']);
});
