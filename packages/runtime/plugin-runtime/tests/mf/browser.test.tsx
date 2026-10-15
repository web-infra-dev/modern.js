import {
  Await,
  useLoaderData,
  useLocation,
} from '@modern-js/runtime-utils/router';
import React, { Suspense, useState } from 'react';
import { setGlobalContext } from '../../src/core/context';
import { registerPlugin } from '../../src/core/plugin';
import { createRoot } from '../../src/core/react';
import { hydrate, render } from '../../src/mf';
import { routerPlugin } from '../../src/router/runtime/plugin';

const tick = () => new Promise(resolve => setTimeout(resolve, 20));

it('mounts the supplied root, updates its router, and keeps two instances independent', async () => {
  const hostData = { loaderData: { page: 'host' }, errors: null };
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
  setGlobalContext({
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
  registerPlugin([routerPlugin()]);
  const ModernRoot = createRoot();
  const a = document.createElement('div');
  const b = document.createElement('div');
  document.body.append(a, b);
  const element = (
    <section data-supplied-root="yes">
      <ModernRoot />
    </section>
  );
  const [first, second] = await Promise.all([
    render(element, a, { url: 'http://producer/apple' }),
    render(element, b, { url: 'http://producer/banana' }),
  ]);
  await tick();
  expect(a.textContent).toBe('/apple:apple');
  expect(b.textContent).toBe('/banana:banana');
  expect(a.querySelector('section')?.getAttribute('data-supplied-root')).toBe(
    'yes',
  );
  const updated = await render(element, a, {
    url: 'http://producer/cherry',
    title: '-updated',
  });
  await tick();
  expect(updated).toBe(first);
  expect(a.textContent).toBe('/cherry:cherry-updated');
  expect(b.textContent).toBe('/banana:banana');
  expect(window._ROUTER_DATA).toBe(hostData);
  first.unmount();
  second.unmount();
  expect(a.innerHTML).toBe('');
  expect(b.innerHTML).toBe('');
  a.remove();
  b.remove();
  delete window._ROUTER_DATA;
});

it('hydrates the supplied tree before deferred loader data, then reuses its root on updates', async () => {
  let loaderCalls = 0;
  function Page() {
    const data = useLoaderData() as { pending: Promise<string> };
    const [count, setCount] = useState(0);
    return (
      <main>
        <button onClick={() => setCount(value => value + 1)}>{count}</button>
        <Suspense fallback={<p>waiting</p>}>
          <Await resolve={data.pending}>{value => <p>{value}</p>}</Await>
        </Suspense>
      </main>
    );
  }
  setGlobalContext({
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
          return { pending: Promise.resolve('wrong') };
        },
      },
    ],
  });
  registerPlugin([routerPlugin()]);
  const ModernRoot = createRoot();
  const element = (
    <section data-supplied-root="yes">
      <ModernRoot />
    </section>
  );
  const container = document.createElement('div');
  container.innerHTML =
    '<section data-supplied-root="yes"><main><button>0</button><!--$?--><template id="mf-B:0"></template><p>waiting</p><!--/$--></main></section><template id="mf-shell"></template>';
  document.body.append(container);
  const originalButton = container.querySelector('button')!;
  const originalSection = container.querySelector('section');
  let deliver!: ReadableStreamDefaultController<unknown>;
  const updates = new ReadableStream({
    start(controller) {
      deliver = controller;
    },
  });
  Object.defineProperty(document, 'readyState', {
    value: 'loading',
    configurable: true,
  });
  const errors: unknown[] = [];
  const root = await hydrate(element, container, {
    snapshot: {
      protocol: 'modern-application/2',
      reactVersion: React.version,
      identifierPrefix: 'mf-',
      shellMarker: 'mf-shell',
      url: 'http://producer/',
      basename: '/',
      props: {},
      routerData: { loaderData: { page: { pending: null } }, errors: null },
      pending: [
        { id: '0', path: ['routerData', 'loaderData', 'page', 'pending'] },
      ],
    },
    updates,
    rootOptions: { onRecoverableError: error => errors.push(error) },
  });
  expect(container.querySelector('section')).toBe(originalSection);
  expect(container.querySelector('button')).toBe(originalButton);
  originalButton.click();
  await tick();
  expect(originalButton.textContent).toBe('1');
  expect(loaderCalls).toBe(0);
  expect(errors).toEqual([]);
  // A Host prop update must not revalidate the unchanged route or force an
  // unfinished Suspense boundary into client rendering.
  expect(
    await render(element, container, {
      url: 'http://producer/',
      title: 'updated-while-streaming',
    }),
  ).toBe(root);
  await tick();
  expect(loaderCalls).toBe(0);
  expect(errors).toEqual([]);
  expect(container.querySelector('button')).toBe(originalButton);
  expect(originalButton.textContent).toBe('1');
  expect(container.textContent).toContain('waiting');
  deliver.enqueue({
    id: '0',
    status: 'fulfilled',
    value: 'late-data',
    pending: [],
  });
  deliver.close();
  await tick();
  expect(errors).toEqual([]);
  // The callback and direct Bridge lifecycle share the same stored instance.
  expect(await render(element, container, { url: 'http://producer/' })).toBe(
    root,
  );
  await tick();
  expect(container.querySelector('button')).toBe(originalButton);
  expect(originalButton.textContent).toBe('1');
  root.unmount();
  expect(container.innerHTML).toBe('');
  container.remove();
  Reflect.deleteProperty(document, 'readyState');
});

it.each(['mount', 'hydrate'])(
  'cancels %s during a pending hook and permits an immediate independent remount',
  async mode => {
    let release!: () => void;
    let entered!: () => void;
    let hookCalls = 0;
    const hookEntered = new Promise<void>(resolve => {
      entered = resolve;
    });
    const blocked = new Promise<void>(resolve => {
      release = resolve;
    });
    setGlobalContext({ entryName: 'index', App: () => <p>replacement</p> });
    registerPlugin([
      {
        name: 'pending-application-hook',
        setup(api) {
          api.onBeforeRender(async () => {
            if (++hookCalls === 1) {
              entered();
              await blocked;
            }
          });
        },
      },
    ]);
    const ModernRoot = createRoot();
    const element = <ModernRoot />;
    const container = document.createElement('div');
    document.body.append(container);
    const controller = new AbortController();
    let streamCancelled = false;
    const updates = new ReadableStream({
      cancel() {
        streamCancelled = true;
      },
    });
    const first =
      mode === 'hydrate'
        ? hydrate(element, container, {
            signal: controller.signal,
            snapshot: {
              protocol: 'modern-application/2',
              reactVersion: React.version,
              identifierPrefix: 'cancel-',
              shellMarker: 'cancel-shell',
              url: 'http://producer/',
              basename: '/',
              props: {},
              initialData: { pending: null },
              pending: [{ id: '0', path: ['initialData', 'pending'] }],
            },
            updates,
          })
        : render(element, container, {
            url: 'http://producer/',
            signal: controller.signal,
          });
    // Attach the rejection observer before abort; the hook remains blocked.
    const cancelled = expect(first).rejects.toThrow('consumer unmounted');
    await hookEntered;
    controller.abort(new Error('consumer unmounted'));
    await cancelled;
    if (mode === 'hydrate') expect(streamCancelled).toBe(true);
    const replacement = await render(element, container, {
      url: 'http://producer/',
    });
    expect(container.textContent).toBe('replacement');
    release();
    await tick();
    expect(container.textContent).toBe('replacement');
    expect(await render(element, container, { url: 'http://producer/' })).toBe(
      replacement,
    );
    replacement.unmount();
    expect(container.innerHTML).toBe('');
    container.remove();
  },
);

it('hydrates root route props from the supplied element and preserves snapshot props as transport data', async () => {
  let loaderCalls = 0;
  function Page({ title }: { title?: string }) {
    const data = useLoaderData() as { label: string };
    return (
      <main>
        <h1>{title}</h1>
        <p>{data.label}</p>
      </main>
    );
  }
  setGlobalContext({
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
          return { label: 'unexpected' };
        },
      },
    ],
  });
  registerPlugin([routerPlugin()]);
  const ModernRoot = createRoot() as React.ComponentType<{ title: string }>;
  const container = document.createElement('div');
  container.innerHTML =
    '<main><h1>supplied-title</h1><p>server-data</p></main>';
  document.body.append(container);
  const originalMain = container.firstChild;
  const snapshot = {
    protocol: 'modern-application/1',
    reactVersion: React.version,
    identifierPrefix: 'props-',
    url: 'http://producer/',
    basename: '/',
    props: { title: 'transport-title' },
    routerData: {
      loaderData: { page: { label: 'server-data' } },
      errors: null,
    },
  };
  const errors: unknown[] = [];
  const root = await hydrate(<ModernRoot title="supplied-title" />, container, {
    snapshot,
    rootOptions: { onRecoverableError: error => errors.push(error) },
  });
  expect(container.firstChild).toBe(originalMain);
  expect(container.querySelector('h1')?.textContent).toBe('supplied-title');
  expect(snapshot.props.title).toBe('transport-title');
  expect(loaderCalls).toBe(0);
  expect(errors).toEqual([]);
  root.unmount();
  container.remove();
});
