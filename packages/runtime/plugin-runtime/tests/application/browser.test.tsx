import { useLoaderData, useLocation } from '@modern-js/runtime-utils/router';
import React from 'react';
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
