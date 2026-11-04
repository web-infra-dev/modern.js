import React from 'react';
import { useLoaderData } from '@modern-js/runtime-utils/router';
import { createRuntime } from '../../src/core/plugin';
import { createScopedRoot } from '../../src/core/react/scope.node';
import { routerPlugin } from '../../src/router/runtime/plugin.node';
import { renderStream } from '../../src/mf/callbacks.node';
import { render, hydrate } from '../../src/mf/callbacks.node';
import { createModernBridgeComponent } from '../../src/mf/provider.node';
import { createBridgeComponent } from '@module-federation/bridge-react/server';

it('runs the selected Root at the consumer basename and transports loader data without restoring the selection prefix', async () => {
  const requests: string[] = [];
  function Page() {
    const data = useLoaderData() as { id: string };
    return <p>Product {data.id}</p>;
  }
  const Root = createScopedRoot({
    routes: [
      {
        id: 'detail',
        type: 'nested',
        path: 'detail/:id',
        component: Page,
        loader: ({ params, request }: any) => {
          requests.push(request.url);
          return { id: params.id };
        },
      },
    ],
    selected: true,
    dataRoute: '/product',
    basename: '/',
    serverLoaders: true,
    getDataBase: () => {
      throw new Error(
        'Server rendering must not call the browser data endpoint',
      );
    },
    createRuntime: (routesConfig, selected) =>
      createRuntime([routerPlugin({}, routesConfig, selected)]),
  });
  const result = await renderStream(<Root />, {
    rootComponent: Root,
    url: 'http://host/inventory/detail/42?tab=stock',
    basename: '/inventory',
    identifierPrefix: 'inventory-',
    props: {},
    signal: new AbortController().signal,
  });
  const html = await new Response(result.stream).text();
  expect(html).toContain('Product');
  expect(html).toContain('42');
  expect(html).not.toContain('<html');
  expect(requests).toEqual(['http://host/inventory/detail/42?tab=stock']);
  expect(result).not.toHaveProperty('snapshot');
  expect(await result.hydration.snapshot).toMatchObject({
    basename: '/inventory',
    url: 'http://host/inventory/detail/42?tab=stock',
    routerData: { loaderData: { detail: { id: '42' } } },
  });
});

it.each(['Modern helper', 'explicit callbacks'])(
  'passes the original scoped Root and business props through the Core provider with %s',
  async kind => {
    const Root = createScopedRoot({
      App: ({ name }: { name: string }) => <p>Hello {name}</p>,
      routes: [],
      selected: false,
      basename: '/',
      serverLoaders: false,
      getDataBase: () => 'http://remote',
      createRuntime: () => createRuntime([]),
    });
    const factory =
      kind === 'Modern helper'
        ? createModernBridgeComponent({ rootComponent: Root })
        : createBridgeComponent({
            rootComponent: Root,
            render,
            hydrate,
            renderStream,
          });
    const provider = factory();
    const result = await provider.renderStream!({
      instanceId: 'inventory-test',
      url: 'http://host/inventory',
      basename: '/inventory',
      identifierPrefix: 'inventory-',
      props: { name: 'Lake' },
      signal: new AbortController().signal,
    });
    let html = '';
    let snapshot: unknown;
    if (!('protocol' in result))
      throw new Error('Expected normalized Bridge producer messages');
    expect(result.hydration).toBe('progressive');
    const reader = result.messages.getReader();
    const types: string[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      types.push(value.type);
      if (value.type === 'html') html += value.html;
      if (value.type === 'ready') snapshot = value.snapshot;
    }
    expect(types).toContain('ready');
    expect(types).not.toContain('data');
    expect(types.at(-1)).toBe('done');
    expect(html).toContain('Hello');
    expect(html).toContain('Lake');
    expect(snapshot).toMatchObject({
      props: { name: 'Lake' },
      basename: '/inventory',
    });
  },
);
