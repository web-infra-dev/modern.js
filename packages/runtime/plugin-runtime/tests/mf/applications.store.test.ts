import { describe, expect, it, rs } from '@rstest/core';
import {
  ApplicationsDiscoveryError,
  createApplicationsStore,
  createSnapshotExpiredError,
  isSnapshotExpiredError,
  type DiscoveryContext,
  type RemoteRoute,
} from '../../src/mf';

function createMockMFInstance() {
  const remotes: Array<{
    name: string;
    entry?: string;
    version?: string;
    alias?: string;
  }> = [];
  return {
    options: { remotes },
    registerRemotes: rs.fn((items: typeof remotes) => {
      for (const item of items) {
        if (!remotes.some(existing => existing.name === item.name)) {
          remotes.push(item);
        }
      }
    }),
  };
}

describe('MF applications discovery store', () => {
  it('discovers multi-layer routes on demand and stops at discoverChildren=false', async () => {
    const instance = createMockMFInstance();
    const calls: Array<{
      consumer: string | null;
      basename: string;
      pathname: string;
      mountId: string;
      parentMountId?: string;
    }> = [];
    const committed: string[] = [];

    const store = createApplicationsStore({
      isBrowser: true,
      getInstance: () => instance as any,
      hooks: {
        default: async (ctx: DiscoveryContext) => {
          calls.push({
            consumer: ctx.consumer?.moduleName ?? null,
            basename: ctx.basename,
            pathname: ctx.pathname,
            mountId: ctx.mountId,
            parentMountId: ctx.parentMountId,
          });
          if (!ctx.consumer) {
            return {
              routes: [
                {
                  route: 'shops/:shopId/*',
                  moduleName: 'shop',
                  expose: './App',
                  versionOrUrl:
                    'https://cdn.example.com/shop/v1/mf-manifest.json',
                  discoverChildren: true,
                },
              ],
            };
          }
          if (ctx.consumer.moduleName === 'shop') {
            return {
              routes: [
                {
                  route: 'recommend/*',
                  moduleName: 'recommendation',
                  expose: './App',
                  versionOrUrl:
                    'https://cdn.example.com/recommendation/v1/mf-manifest.json',
                  discoverChildren: false,
                },
              ],
            };
          }
          return { routes: [] };
        },
        lifecycle: {
          onCommit(txId) {
            committed.push(txId);
          },
        },
      },
    });

    const result = await store.discoverApplications({
      pathname: '/shops/42/recommend/detail',
      search: '?tab=specs',
    });

    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      consumer: null,
      basename: '/',
      pathname: '/shops/42/recommend/detail',
      mountId: 'root',
    });
    expect(calls[1]).toMatchObject({
      consumer: 'shop',
      basename: '/shops/42',
      pathname: '/shops/42/recommend/detail',
      parentMountId: 'root',
    });
    expect(result.contexts).toHaveLength(2);
    expect(result.contexts[1].matchedRoute?.moduleName).toBe('recommendation');
    expect(committed).toHaveLength(1);
    expect(instance.registerRemotes).toHaveBeenCalledTimes(1);
    expect(instance.options.remotes).toEqual([
      {
        name: 'shop',
        entry: 'https://cdn.example.com/shop/v1/mf-manifest.json',
      },
      {
        name: 'recommendation',
        entry: 'https://cdn.example.com/recommendation/v1/mf-manifest.json',
      },
    ]);

    // Second default query for same target uses cache with 0 hook calls.
    await store.discoverApplications({
      pathname: '/shops/42/recommend/detail',
      search: '?tab=specs',
    });
    expect(calls).toHaveLength(2);
  });

  it('prunes revoked routes on reload without deleting other cached targets', async () => {
    const instance = createMockMFInstance();
    let shopEnabled = true;

    const store = createApplicationsStore({
      isBrowser: true,
      getInstance: () => instance as any,
      hooks: {
        default: async ctx => {
          if (ctx.pathname.startsWith('/shop')) {
            return {
              routes: shopEnabled
                ? [
                    {
                      route: 'shop/*',
                      moduleName: 'shop',
                      expose: './App',
                      versionOrUrl:
                        'https://cdn.example.com/shop/mf-manifest.json',
                      discoverChildren: false,
                    },
                  ]
                : [],
            };
          }
          if (ctx.pathname.startsWith('/orders')) {
            return {
              routes: [
                {
                  route: 'orders/*',
                  moduleName: 'orders',
                  expose: './App',
                  versionOrUrl:
                    'https://cdn.example.com/orders/mf-manifest.json',
                  discoverChildren: false,
                },
              ],
            };
          }
          return { routes: [] };
        },
      },
    });

    await store.discoverApplications({ pathname: '/shop/home' });
    await store.discoverApplications({ pathname: '/orders/list' });
    expect(
      store
        .getRoutesForMount('root')
        .map(r => r.moduleName)
        .sort(),
    ).toEqual(['orders', 'shop']);

    shopEnabled = false;
    await store.discoverApplications({
      pathname: '/shop/home',
      cache: 'reload',
    });
    expect(store.getRoutesForMount('root').map(r => r.moduleName)).toEqual([
      'orders',
    ]);
  });

  it('rejects missing discoverChildren, conflicting versions, unresolved semver, and cycles', async () => {
    const instance = createMockMFInstance();

    const missingFlagStore = createApplicationsStore({
      isBrowser: true,
      getInstance: () => instance as any,
      hooks: {
        default: async () => ({
          routes: [
            {
              route: 'shop/*',
              moduleName: 'shop',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/shop/mf-manifest.json',
            } as unknown as RemoteRoute,
          ],
        }),
      },
    });
    await expect(
      missingFlagStore.discoverApplications({ pathname: '/shop' }),
    ).rejects.toMatchObject({ code: 'MISSING_DISCOVER_CHILDREN' });

    const conflictStore = createApplicationsStore({
      isBrowser: true,
      getInstance: () => instance as any,
      hooks: {
        default: async () => ({
          routes: [
            {
              route: 'shop-a/*',
              moduleName: 'shop',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/shop/v1/mf-manifest.json',
              discoverChildren: false,
            },
            {
              route: 'shop-b/*',
              moduleName: 'shop',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/shop/v2/mf-manifest.json',
              discoverChildren: false,
            },
          ],
        }),
      },
    });
    await expect(
      conflictStore.discoverApplications({ pathname: '/shop-a' }),
    ).rejects.toMatchObject({ code: 'MODULE_CONFLICT' });

    const unresolvedVersionStore = createApplicationsStore({
      isBrowser: true,
      getInstance: () => instance as any,
      hooks: {
        default: async () => ({
          routes: [
            {
              route: 'shop/*',
              moduleName: 'unlisted_shop_module',
              expose: './App',
              versionOrUrl: '1.2.3',
              discoverChildren: false,
            },
          ],
        }),
      },
    });
    await expect(
      unresolvedVersionStore.discoverApplications({ pathname: '/shop' }),
    ).rejects.toMatchObject({ code: 'UNRESOLVED_VERSION' });

    const cycleStore = createApplicationsStore({
      isBrowser: true,
      getInstance: () => instance as any,
      hooks: {
        default: async () => ({
          routes: [
            {
              route: 'loop/*',
              moduleName: 'loopApp',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/loop/mf-manifest.json',
              discoverChildren: true,
            },
          ],
        }),
      },
      maxDepth: 3,
    });
    await expect(
      cycleStore.discoverApplications({ pathname: '/loop/loop/loop/loop' }),
    ).rejects.toMatchObject({ code: 'MAX_DEPTH_EXCEEDED' });
  });

  it('dedupes shared in-flight requests and keeps other callers alive when one aborts', async () => {
    const instance = createMockMFInstance();
    let resolveLoad!: (routes: RemoteRoute[]) => void;
    let loadCount = 0;

    const store = createApplicationsStore({
      isBrowser: true,
      getInstance: () => instance as any,
      hooks: {
        default: async () => {
          loadCount += 1;
          const routes = await new Promise<RemoteRoute[]>(resolve => {
            resolveLoad = resolve;
          });
          return { routes };
        },
      },
    });

    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const p1 = store.discoverApplications({
      pathname: '/shop',
      signal: controller1.signal,
    });
    const p2 = store.discoverApplications({
      pathname: '/shop',
      signal: controller2.signal,
    });
    expect(loadCount).toBe(1);

    controller1.abort(new Error('caller-1-cancelled'));
    await expect(p1).rejects.toThrow('caller-1-cancelled');

    resolveLoad([
      {
        route: 'shop/*',
        moduleName: 'shop',
        expose: './App',
        versionOrUrl: 'https://cdn.example.com/shop/mf-manifest.json',
        discoverChildren: false,
      },
    ]);
    const r2 = await p2;
    expect(r2.contexts[0].routes).toHaveLength(1);
  });

  it('enforces timeout even when load() ignores AbortSignal and calls onDiscard', async () => {
    const discarded: string[] = [];
    const store = createApplicationsStore({
      isBrowser: true,
      timeoutMs: 30,
      hooks: {
        default: () => new Promise(() => {}),
        lifecycle: {
          onDiscard(txId) {
            discarded.push(txId);
          },
        },
      },
    });

    await expect(
      store.discoverApplications({ pathname: '/hang' }),
    ).rejects.toBeInstanceOf(ApplicationsDiscoveryError);
    expect(discarded).toHaveLength(1);
  });

  it('handles snapshot expiration with defer, reload, and SSR immediate rejection', async () => {
    const expiredErr = createSnapshotExpiredError('Deployment changed', {
      source: 'portal',
      expectedSid: 'sid-1',
      receivedSid: 'sid-2',
    });
    expect(isSnapshotExpiredError(expiredErr)).toBe(true);

    const ssrStore = createApplicationsStore({
      isBrowser: false,
      hooks: {
        default: async () => {
          throw expiredErr;
        },
      },
    });
    await expect(
      ssrStore.discoverApplications({ pathname: '/shop' }),
    ).rejects.toThrow('Deployment changed');

    const reloadFn = rs.fn();
    const browserDeferStore = createApplicationsStore({
      isBrowser: true,
      reloadPage: reloadFn,
      hooks: {
        default: async () => {
          throw expiredErr;
        },
        onSnapshotExpired: async () => 'defer',
      },
    });
    const deferred = await browserDeferStore.discoverApplications({
      pathname: '/shop',
    });
    expect(deferred.target.pathname).toBe('/shop');
    expect(reloadFn).not.toHaveBeenCalled();

    const browserReloadStore = createApplicationsStore({
      isBrowser: true,
      reloadPage: reloadFn,
      hooks: {
        default: async () => {
          throw expiredErr;
        },
      },
    });
    await expect(
      browserReloadStore.discoverApplications({ pathname: '/shop' }),
    ).rejects.toThrow('Deployment changed');
    expect(reloadFn).toHaveBeenCalledTimes(1);
  });

  it('dehydrates SSR state without request secrets and hydrates browser with 0 load calls', async () => {
    const serverInstance = createMockMFInstance();
    const browserInstance = createMockMFInstance();
    let lifecycleHydrated: unknown;

    const serverStore = createApplicationsStore({
      isBrowser: false,
      request: new Request('https://portal.test/shop/item', {
        headers: { cookie: 'secret=token' },
      }),
      getInstance: () => serverInstance as any,
      hooks: {
        default: async ctx => {
          expect(ctx.request?.headers.get('cookie')).toBe('secret=token');
          return {
            routes: [
              {
                route: 'shop/*',
                moduleName: 'shop',
                expose: './App',
                versionOrUrl: 'https://cdn.example.com/shop/mf-manifest.json',
                discoverChildren: false,
              },
            ],
          };
        },
        lifecycle: {
          dehydrate: () => ({ sourceMap: { root: 'portal-v1' } }),
        },
      },
    });

    await serverStore.discoverApplications({ pathname: '/shop/item' });
    const serialized = serverStore.dehydrate()!;
    expect(JSON.stringify(serialized)).not.toContain('secret=token');
    expect(serialized.lifecycleState).toEqual({
      sourceMap: { root: 'portal-v1' },
    });

    const browserLoad = rs.fn(async () => ({ routes: [] }));
    const browserStore = createApplicationsStore({
      isBrowser: true,
      getInstance: () => browserInstance as any,
      hooks: {
        default: browserLoad,
        lifecycle: {
          hydrate(state) {
            lifecycleHydrated = state;
          },
        },
      },
    });

    browserStore.hydrate(serialized);
    expect(lifecycleHydrated).toEqual({ sourceMap: { root: 'portal-v1' } });
    expect(browserInstance.options.remotes).toEqual([
      {
        name: 'shop',
        entry: 'https://cdn.example.com/shop/mf-manifest.json',
      },
    ]);

    const res = await browserStore.discoverApplications({
      pathname: '/shop/item',
    });
    expect(browserLoad).not.toHaveBeenCalled();
    expect(res.contexts[0].routes[0].moduleName).toBe('shop');
  });
});
