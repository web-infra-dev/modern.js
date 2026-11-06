import React, { useState } from 'react';
import {
  Link,
  useLoaderData,
  useLocation,
} from '@modern-js/runtime-utils/router';
import { createRuntime } from '../../src/core/plugin';
import { createScopedRoot } from '../../src/core/react/scope';
import type { ScopedRootDefinition } from '../../src/core/react/scopeDefinition';
import { routerPlugin } from '../../src/router/runtime/plugin';
import { hydrate, render } from '../../src/mf/callbacks';
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
