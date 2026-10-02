import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { type Ref, createRef } from 'react';
import { Link, NavLink } from '../../src/runtime/prefetchLink';

describe.each([
  ['Link', Link],
  ['NavLink', NavLink],
] as const)('%s anchor refs', (_name, Component) => {
  async function renderLink(ref: Ref<HTMLAnchorElement>) {
    const rootRoute = createRootRoute({ component: Outlet });
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => (
        <Component to="/target" ref={ref}>
          Target
        </Component>
      ),
    });
    const targetRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/target',
    });
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: ['/'] }),
      routeTree: rootRoute.addChildren([indexRoute, targetRoute]),
    });
    await router.load();
    const result = render(<RouterProvider router={router} />);
    const anchor = await screen.findByRole('link', { name: 'Target' });
    expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    expect(anchor.getAttribute('href')).toBe('/target');
    return { ...result, anchor };
  }

  test('sets and clears an object ref for the anchor', async () => {
    const ref = createRef<HTMLAnchorElement>();
    const { anchor, unmount } = await renderLink(ref);

    expect(ref.current).toBe(anchor);
    unmount();
    expect(ref.current).toBeNull();
  });

  test('calls a callback ref with the anchor and null on unmount', async () => {
    const ref = rstest.fn();
    const { anchor, unmount } = await renderLink(ref);

    expect(ref).toHaveBeenLastCalledWith(anchor);
    unmount();
    expect(ref).toHaveBeenLastCalledWith(null);
  });
});
