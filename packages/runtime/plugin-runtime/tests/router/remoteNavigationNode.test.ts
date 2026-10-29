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
function remoteRouter(initial = '/detail/42?tab=stock#summary') {
  return createMemoryRouter(
    [
      {
        path: '/',
        children: [
          { index: true },
          { path: 'detail/:id' },
          { path: 'redirect', loader: () => redirect('/detail/99') },
        ],
      },
      { path: '*' },
    ],
    { initialEntries: [initial] },
  );
}

it('preserves query, hash and encoded segments while matching basename at a segment boundary', () => {
  expect(removeBasename('/inventory/a%2Fb?tab=a/b#part', '/inventory/')).toBe(
    '/a%2Fb?tab=a/b#part',
  );
  expect(removeBasename('/inventory?tab=stock#part', '/inventory')).toBe(
    '/?tab=stock#part',
  );
  expect(removeBasename('/inventory-other', '/inventory')).toBeUndefined();
  expect(addBasename('/detail/42?tab=stock#part', '/inventory/')).toBe(
    '/inventory/detail/42?tab=stock#part',
  );
  expect(addBasename('/detail', '/')).toBe('/detail');
});

it('synchronizes both directions, replacement and history intent without echoing host updates', async () => {
  const host = hostRouter(
    '/admin/stores/100/inventory/detail/42?tab=stock#summary',
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
  host.update('/admin/stores/100/inventory/detail/43?tab=price#chart');
  await waitFor(() =>
    expect(routerLocation(router)).toBe('/detail/43?tab=price#chart'),
  );
  expect(host.calls).toHaveLength(0);
  await router.navigate('/detail/44');
  expect(host.calls).toEqual([
    { to: '/admin/stores/100/inventory/detail/44', replace: false },
  ]);
  await router.navigate('/detail/45', { replace: true });
  expect(host.calls.at(-1)).toEqual({
    to: '/admin/stores/100/inventory/detail/45',
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
  const host = hostRouter('/stores/100/inventory');
  const first = remoteRouter('/');
  const second = remoteRouter('/');
  const errors = rstest.fn();
  const stopFirst = connectRemoteRouter(
    first,
    '/stores/100/inventory',
    host.host,
    errors,
  );
  const stopSecond = connectRemoteRouter(second, '/orders', host.host, errors);
  host.update('/stores/200/inventory/detail/42');
  stopFirst();
  const rebound = connectRemoteRouter(
    first,
    '/stores/200/inventory',
    host.host,
    errors,
  );
  await waitFor(() => expect(routerLocation(first)).toBe('/detail/42'));
  expect(routerLocation(second)).toBe('/');
  expect(host.calls).toHaveLength(0);
  rebound();
  stopSecond();
  first.dispose();
  second.dispose();
});

it('forwards final producer redirects and ignores navigation after detaching', async () => {
  const host = hostRouter('/inventory');
  const router = remoteRouter('/');
  const stop = connectRemoteRouter(
    router,
    '/inventory',
    host.host,
    rstest.fn(),
  );
  host.update('/inventory/redirect');
  await waitFor(() => expect(router.state.navigation.state).toBe('idle'));
  expect(router.state.errors).toBeNull();
  expect(routerLocation(router)).toBe('/detail/99');
  await waitFor(() =>
    expect(host.host.getLocation()).toBe('/inventory/detail/99'),
  );
  expect(host.calls).toEqual([{ to: '/inventory/detail/99', replace: true }]);
  stop();
  host.update('/inventory/detail/100');
  expect(routerLocation(router)).toBe('/detail/99');
  router.dispose();
});

it('cancels an older host navigation when a newer location returns to the current page', async () => {
  let release!: () => void;
  const router = createMemoryRouter(
    [
      { path: '/' },
      {
        path: '/slow',
        loader: () =>
          new Promise<void>(resolve => {
            release = resolve;
          }),
      },
    ],
    { initialEntries: ['/'] },
  );
  const host = hostRouter('/inventory');
  const stop = connectRemoteRouter(
    router,
    '/inventory',
    host.host,
    rstest.fn(),
  );
  host.update('/inventory/slow');
  await waitFor(() => expect(release).toBeDefined());
  host.update('/inventory');
  release();
  await waitFor(() => expect(router.state.navigation.state).toBe('idle'));
  expect(routerLocation(router)).toBe('/');
  expect(host.calls).toHaveLength(0);
  stop();
  router.dispose();
});

it('does not forward a queued remote navigation after disconnecting', async () => {
  const router = remoteRouter('/');
  const host = hostRouter('/inventory');
  const stop = connectRemoteRouter(
    router,
    '/inventory',
    host.host,
    rstest.fn(),
  );
  const pending = router.navigate('/detail/42');
  stop();
  await pending;
  await Promise.resolve();
  expect(host.calls).toHaveLength(0);
  expect(host.listeners.size).toBe(0);
  router.dispose();
});

it('forwards the latest request when the same target is navigated synchronously twice', async () => {
  const router = remoteRouter('/');
  const host = hostRouter('/inventory');
  const stop = connectRemoteRouter(
    router,
    '/inventory',
    host.host,
    rstest.fn(),
  );
  await Promise.all([
    router.navigate('/detail/42'),
    router.navigate('/detail/42', { replace: true }),
  ]);
  await waitFor(() =>
    expect(host.calls).toEqual([{ to: '/inventory/detail/42', replace: true }]),
  );
  stop();
  router.dispose();
});

it('does not forward queued history intent after the host leaves the mount', async () => {
  const router = remoteRouter('/');
  const host = hostRouter('/inventory');
  const stop = connectRemoteRouter(
    router,
    '/inventory',
    host.host,
    rstest.fn(),
  );
  const pending = router.navigate(-1);
  host.update('/dashboard');
  await pending;
  expect(host.calls).toHaveLength(0);
  stop();
  router.dispose();
});

it('mounts a selected application at the consumer path without exposing its selector', async () => {
  const host = hostRouter(
    '/admin/stores/100/inventory/detail/42?tab=stock#summary',
  );
  const router = remoteRouter();
  const errors = rstest.fn();
  const stop = connectRemoteRouter(
    router,
    '/admin/stores/100/inventory',
    host.host,
    errors,
  );
  try {
    await waitFor(() =>
      expect(routerLocation(router)).toBe('/detail/42?tab=stock#summary'),
    );
    host.update('/admin/stores/100/inventory/detail/43?tab=price#chart');
    await waitFor(() =>
      expect(routerLocation(router)).toBe('/detail/43?tab=price#chart'),
    );
    expect(host.calls).toHaveLength(0);
    await router.navigate('/detail/44', { replace: true });
    expect(host.calls).toEqual([
      { to: '/admin/stores/100/inventory/detail/44', replace: true },
    ]);
    await router.navigate('/orders');
    expect(host.calls.at(-1)).toEqual({
      to: '/admin/stores/100/inventory/orders',
      replace: false,
    });
    expect(errors).not.toHaveBeenCalled();
  } finally {
    stop();
    router.dispose();
  }
});

it('maps a selected application home, producer redirect and host history without repeating the selector', async () => {
  const host = hostRouter('/inventory?tab=stock#summary');
  const router = remoteRouter('/?tab=stock#summary');
  const stop = connectRemoteRouter(
    router,
    '/inventory',
    host.host,
    rstest.fn(),
  );
  try {
    expect(routerLocation(router)).toBe('/?tab=stock#summary');
    host.update('/inventory/redirect');
    await waitFor(() =>
      expect(host.host.getLocation()).toBe('/inventory/detail/99'),
    );
    await router.navigate(-1);
    expect(host.calls.at(-1)).toEqual({ to: -1, replace: undefined });
  } finally {
    stop();
    router.dispose();
  }
});

it('treats source-like path segments as ordinary local routes without implicit selection mapping', () => {
  expect(addBasename('/product/detail/a%2Fb?tab=a/b#chart', '/inventory')).toBe(
    '/inventory/product/detail/a%2Fb?tab=a/b#chart',
  );
  expect(removeBasename('/inventory/product/detail/42', '/inventory')).toBe(
    '/product/detail/42',
  );
  expect(addBasename('/?tab=stock#summary', '/inventory')).toBe(
    '/inventory?tab=stock#summary',
  );
  expect(addBasename('/', '/inventory')).toBe('/inventory');
});
