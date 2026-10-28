import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  Outlet,
} from '@modern-js/runtime-utils/router';
import { useRemoteBasename } from '../../src/mf/remote';

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
