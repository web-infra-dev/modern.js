import {
  Await,
  useLoaderData,
  useLocation,
} from '@modern-js/runtime-utils/router';
import React, { Suspense, useState } from 'react';
import { createApplication } from '../../src/application';
import { setGlobalContext } from '../../src/core/context';
import { registerPlugin } from '../../src/core/plugin';
import { routerPlugin } from '../../src/router/runtime/plugin';

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
  const a = document.createElement('div');
  const b = document.createElement('div');
  document.body.append(a, b);
  const first = createApplication();
  const second = createApplication();
  await Promise.all([
    first.mount(a, { url: 'http://example/apple', identifierPrefix: 'a-' }),
    second.mount(b, { url: 'http://example/banana', identifierPrefix: 'b-' }),
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
          return { item: 'incorrect-client-load' };
        },
      },
    ],
  });
  registerPlugin([routerPlugin()]);
  const container = document.createElement('div');
  container.innerHTML = '<p>server-product</p>';
  document.body.append(container);
  const paragraph = container.firstChild;
  const errors: unknown[] = [];
  const app = createApplication();
  await app.hydrate(
    container,
    {
      protocol: 'modern-application/1',
      reactVersion: React.version,
      identifierPrefix: 'hydrated-',
      url: 'http://example/',
      basename: '/',
      props: {},
      routerData: {
        loaderData: { page: { item: 'server-product' } },
        errors: null,
      },
    },
    {
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
      protocol: 'modern-application/2' as const,
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
    registerPlugin([routerPlugin()]);
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
