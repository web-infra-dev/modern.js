import React, { useState } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Link, Outlet, useLoaderData } from '@modern-js/runtime-utils/router';
import { createScopedRoot } from '../../src/core/react/scope';
import { createRuntime, registerPlugin } from '../../src/core/plugin';
import { createRoot } from '../../src/core/react';
import { setGlobalContext } from '../../src/core/context';
import { routerPlugin } from '../../src/router/runtime/plugin';

it('isolates hooks, loaders and navigation across two mounts of the same exported Root', async () => {
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
        <Link to="/product/detail/42">Detail</Link>
        <Outlet />
      </section>
    );
  }
  const Root = createScopedRoot({
    route: '/product',
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
            path: 'product',
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
                component: () => <p>Detail page</p>,
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
    await waitFor(() => expect(first.container.textContent).toContain('List'));
    await waitFor(() => expect(second.container.textContent).toContain('List'));
    fireEvent.click(first.container.querySelector('button')!);
    fireEvent.click(first.container.querySelector('a')!);
    await waitFor(() =>
      expect(first.container.textContent).toContain('Detail page'),
    );
    expect(second.container.textContent).toContain('List');
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
    expect(requests).toHaveLength(1);
  } finally {
    first.unmount();
    second.unmount();
    window._ROUTER_DATA = hostData;
  }
});

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
    route: '/product',
    basename: '/',
    serverLoaders: false,
    getDataBase: () => 'http://producer',
    routes: [
      {
        id: 'product',
        type: 'nested',
        origin: 'config',
        path: '/product',
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
