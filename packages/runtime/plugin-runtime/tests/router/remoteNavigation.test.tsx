import React from 'react';
import type { ReactRemoteProps } from '@module-federation/bridge-react/base';
import { act, render, waitFor } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  Outlet,
} from '@modern-js/runtime-utils/router';
import { ReactRemote, useRemoteBasename } from '../../src/mf/remote';

const { bridgeRender } = rstest.hoisted(() => ({
  bridgeRender: rstest.fn((_props: ReactRemoteProps) => null),
}));
rstest.mock('@module-federation/bridge-react/base', () => ({
  ReactRemote: bridgeRender,
}));

it('uses the local splat boundary with a host basename, dynamic parents, pathless and index routes', async () => {
  function Boundary() {
    return (
      <>
        <span data-testid="base">{useRemoteBasename()}</span>
        <Outlet />
      </>
    );
  }
  const host = createMemoryRouter(
    [
      {
        path: '/stores/:storeId',
        children: [
          {
            Component: Outlet,
            children: [
              {
                path: 'inventory/*',
                Component: Boundary,
                children: [
                  { path: 'detail/:id', element: <p>Nested child</p> },
                ],
              },
            ],
          },
        ],
      },
    ],
    {
      basename: '/admin',
      initialEntries: [
        '/admin/stores/100/inventory/detail/42?tab=stock#summary',
      ],
    },
  );
  const view = render(<RouterProvider router={host} />);
  expect(view.getByTestId('base').textContent).toBe(
    '/admin/stores/100/inventory',
  );
  await act(async () => {
    await host.navigate('/stores/200/inventory/detail/43');
  });
  await waitFor(() =>
    expect(view.getByTestId('base').textContent).toBe(
      '/admin/stores/200/inventory',
    ),
  );
  view.unmount();
  host.dispose();
  const index = createMemoryRouter(
    [
      {
        path: '/inventory',
        children: [
          {
            Component: Outlet,
            children: [
              {
                index: true,
                Component: () => <span>{useRemoteBasename()}</span>,
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: ['/inventory'] },
  );
  const indexView = render(<RouterProvider router={index} />);
  expect(indexView.container.textContent).toBe('/inventory');
  indexView.unmount();
  index.dispose();
});

it('supports an explicit browser mount outside Modern Router and releases its location subscription', async () => {
  const original = window.location.href;
  window.history.replaceState(null, '', '/inventory/product?tab=stock#summary');
  const view = render(
    <ReactRemote remote="shop/Product" basename="/inventory" />,
  );
  try {
    const navigation = bridgeRender.mock.lastCall![0].navigation!;
    const listener = rstest.fn();
    expect(navigation.getLocation()).toBe(
      '/inventory/product?tab=stock#summary',
    );
    const stop = navigation.subscribe(listener);
    await navigation.navigate('/inventory/product/detail/42?tab=price#chart');
    expect(navigation.getLocation()).toBe(
      '/inventory/product/detail/42?tab=price#chart',
    );
    expect(listener).toHaveBeenCalledTimes(1);
    await navigation.navigate('/inventory/product/detail/43', {
      replace: true,
    });
    expect(navigation.getLocation()).toBe('/inventory/product/detail/43');
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(listener).toHaveBeenCalledTimes(2);
  } finally {
    view.unmount();
    window.history.replaceState(null, '', original);
  }
});

it('leaves memory cards independent and preserves an explicit custom Router adapter', () => {
  const card = render(<ReactRemote remote="shop/Product" />);
  expect(bridgeRender.mock.lastCall![0].navigation).toBeUndefined();
  card.unmount();
  const navigation = {
    getLocation: () => '/inventory/product',
    subscribe: () => () => {},
    navigate: rstest.fn(),
  };
  const custom = render(
    <ReactRemote
      remote="shop/Product"
      basename="/inventory"
      navigation={navigation}
    />,
  );
  expect(bridgeRender.mock.lastCall![0].navigation).toBe(navigation);
  custom.unmount();
});
