import { createMemoryRouter, redirect } from '@modern-js/runtime-utils/router';
import type { BridgeNavigation } from '@module-federation/bridge-react/base';
import {
  addBasename,
  removeBasename,
  connectRemoteRouter,
  routerLocation,
} from '../../src/mf/navigation';

const waitFor = rstest.waitFor;

function hostRouter(initial: string) {
  let location = initial;
  const listeners = new Set<() => void>();
  const calls: { to: string | number; replace?: boolean }[] = [];
  const host: BridgeNavigation = {
    getLocation: () => location,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    navigate: (to, options) => {
      calls.push({ to, replace: options?.replace });
      if (typeof to === 'string') update(to);
    },
  };
  function update(next: string) {
    location = next;
    for (const listener of listeners) listener();
  }
  return { host, calls, update, listeners };
}
function remoteRouter(initial = '/product/detail/42?tab=stock#summary') {
  return createMemoryRouter(
    [
      {
        path: '/product',
        children: [
          { index: true },
          { path: 'detail/:id' },
          { path: 'redirect', loader: () => redirect('/product/detail/99') },
        ],
      },
      { path: '*' },
    ],
    { initialEntries: [initial] },
  );
}

it('preserves query, hash and encoded segments while matching basename at a segment boundary', () => {
  expect(
    removeBasename('/inventory/product/a%2Fb?tab=a/b#part', '/inventory/'),
  ).toBe('/product/a%2Fb?tab=a/b#part');
  expect(removeBasename('/inventory?tab=stock#part', '/inventory')).toBe(
    '/?tab=stock#part',
  );
  expect(
    removeBasename('/inventory-other/product', '/inventory'),
  ).toBeUndefined();
  expect(addBasename('/product/detail/42?tab=stock#part', '/inventory/')).toBe(
    '/inventory/product/detail/42?tab=stock#part',
  );
  expect(addBasename('/product', '/')).toBe('/product');
});

it('synchronizes both directions, replacement and history intent without echoing host updates', async () => {
  const host = hostRouter(
    '/admin/stores/100/inventory/product/detail/42?tab=stock#summary',
  );
  const router = remoteRouter();
  const original = router.navigate;
  const errors = rstest.fn();
  const stop = connectRemoteRouter(
    router,
    '/admin/stores/100/inventory',
    host.host,
    errors,
  );
  host.update('/admin/stores/100/inventory/product/detail/43?tab=price#chart');
  await waitFor(() =>
    expect(routerLocation(router)).toBe('/product/detail/43?tab=price#chart'),
  );
  expect(host.calls).toHaveLength(0);
  await router.navigate('/product/detail/44');
  expect(host.calls).toEqual([
    { to: '/admin/stores/100/inventory/product/detail/44', replace: false },
  ]);
  await router.navigate('/product/detail/45', { replace: true });
  expect(host.calls.at(-1)).toEqual({
    to: '/admin/stores/100/inventory/product/detail/45',
    replace: true,
  });
  await router.navigate(-1);
  expect(host.calls.at(-1)).toEqual({ to: -1, replace: undefined });
  expect(errors).not.toHaveBeenCalled();
  stop();
  expect(router.navigate).toBe(original);
  expect(host.listeners.size).toBe(0);
  router.dispose();
});

it('rebinds dynamic prefixes without replacing the memory router and leaves an unrelated instance alone', async () => {
  const host = hostRouter('/stores/100/inventory/product');
  const first = remoteRouter('/product');
  const second = remoteRouter('/product');
  const errors = rstest.fn();
  const stopFirst = connectRemoteRouter(
    first,
    '/stores/100/inventory',
    host.host,
    errors,
  );
  const stopSecond = connectRemoteRouter(second, '/orders', host.host, errors);
  host.update('/stores/200/inventory/product/detail/42');
  stopFirst();
  const rebound = connectRemoteRouter(
    first,
    '/stores/200/inventory',
    host.host,
    errors,
  );
  await waitFor(() => expect(routerLocation(first)).toBe('/product/detail/42'));
  expect(routerLocation(second)).toBe('/product');
  expect(host.calls).toHaveLength(0);
  rebound();
  stopSecond();
  first.dispose();
  second.dispose();
});

it('forwards final producer redirects and ignores navigation after detaching', async () => {
  const host = hostRouter('/inventory/product');
  const router = remoteRouter('/product');
  const stop = connectRemoteRouter(
    router,
    '/inventory',
    host.host,
    rstest.fn(),
  );
  host.update('/inventory/product/redirect');
  await waitFor(() => expect(router.state.navigation.state).toBe('idle'));
  expect(router.state.errors).toBeNull();
  expect(routerLocation(router)).toBe('/product/detail/99');
  await waitFor(() =>
    expect(host.host.getLocation()).toBe('/inventory/product/detail/99'),
  );
  expect(host.calls).toEqual([
    { to: '/inventory/product/detail/99', replace: true },
  ]);
  stop();
  host.update('/inventory/product/detail/100');
  expect(routerLocation(router)).toBe('/product/detail/99');
  router.dispose();
});

it('cancels an older host navigation when a newer location returns to the current page', async () => {
  let release!: () => void;
  const router = createMemoryRouter(
    [
      { path: '/product' },
      {
        path: '/slow',
        loader: () =>
          new Promise<void>(resolve => {
            release = resolve;
          }),
      },
    ],
    { initialEntries: ['/product'] },
  );
  const host = hostRouter('/inventory/product');
  const stop = connectRemoteRouter(
    router,
    '/inventory',
    host.host,
    rstest.fn(),
  );
  host.update('/inventory/slow');
  await waitFor(() => expect(release).toBeDefined());
  host.update('/inventory/product');
  release();
  await waitFor(() => expect(router.state.navigation.state).toBe('idle'));
  expect(routerLocation(router)).toBe('/product');
  expect(host.calls).toHaveLength(0);
  stop();
  router.dispose();
});

it('does not forward a queued remote navigation after disconnecting', async () => {
  const router = remoteRouter('/product');
  const host = hostRouter('/inventory/product');
  const stop = connectRemoteRouter(router, '/inventory', host.host, rstest.fn());
  const pending = router.navigate('/product/detail/42');
  stop();
  await pending;
  await Promise.resolve();
  expect(host.calls).toHaveLength(0);
  expect(host.listeners.size).toBe(0);
  router.dispose();
});
