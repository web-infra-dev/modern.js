import React from 'react';
import {
  Outlet,
  useLoaderData,
  useNavigate,
} from '@modern-js/runtime-utils/router';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { helpers, init } from '@module-federation/enhanced/runtime';
import { render as browserRender } from '../../src/core/browser';
import { setGlobalContext } from '../../src/core/context';
import {
  createRuntime,
  registerRuntimeDefinition,
} from '../../src/core/plugin';
import { createRoot as createModernRoot } from '../../src/core/react';
import {
  createScopedRoot,
  type ScopedRootDefinition,
} from '../../src/core/react/scope';
import {
  mfApplicationsPlugin,
  render as bridgeRender,
  useApplications,
  type SerializedApplicationsState,
} from '../../src/mf';
import routerPlugin from '../../src/router/internal';

const APPLICATIONS_DATA_SCRIPT_ID = '__MODERN_APPLICATIONS_DATA__';
const INTERNAL_MOUNT_ID_KEY = '__modern_mf_mount_id__';
const INTERNAL_CONSUMER_KEY = '__modern_mf_consumer__';

const tick = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms));
const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const fn of cleanups.splice(0).reverse()) {
    try {
      fn();
    } catch {
      // ignore test cleanup error
    }
  }
  delete (globalThis as Record<symbol, unknown>)[
    Symbol.for('modern-js.mf.applications.browser-store')
  ];
  document.getElementById(APPLICATIONS_DATA_SCRIPT_ID)?.remove();
  delete (window as any)[APPLICATIONS_DATA_SCRIPT_ID];
  helpers.global.resetFederationGlobalInfo();
});

function setupMockFederationHost(
  modules: Record<string, Record<string, unknown>>,
) {
  return init({
    name: 'portal',
    remotes: [],
    plugins: [
      {
        name: 'test-remote-loader',
        beforeLoadRemote({ id }) {
          const mod = modules[id];
          if (!mod) return;
          return {
            factory: () => mod,
          };
        },
      },
    ],
  });
}

describe('MF applications browser integration', () => {
  it('discovers dynamic routes on CSR mount, supports client navigation, and exposes useApplications + loader context', async () => {
    window.history.replaceState(null, '', '/');

    setupMockFederationHost({
      'shop/App': {
        default: function ShopPage({ region }: { region?: string }) {
          const apps = useApplications();
          return (
            <div data-testid="shop-page">
              {`Shop:${region || 'default'}:${String(typeof apps.discoverApplications === 'function')}`}
            </div>
          );
        },
      },
    });

    const load = rs.fn(async (ctx: any) => {
      if (ctx.pathname.startsWith('/shop')) {
        return {
          routes: [
            {
              route: 'shop/*',
              moduleName: 'shop',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/shop/remoteEntry.js',
              discoverChildren: false,
              props: { region: 'cn' },
            },
          ],
        };
      }
      return { routes: [] };
    });

    let nav!: ReturnType<typeof useNavigate>;
    let loaderHadApplications = false;

    function RootLayout() {
      nav = useNavigate();
      return (
        <div data-testid="portal-layout">
          <Outlet />
        </div>
      );
    }
    function HomePage() {
      const data = useLoaderData() as { hasApps: boolean };
      return <div data-testid="home">{`Home:${String(data.hasApps)}`}</div>;
    }

    setGlobalContext({
      entryName: 'index',
      basename: '/',
      routes: [
        {
          id: 'root_layout',
          type: 'nested',
          isRoot: true,
          path: '/',
          component: RootLayout,
          children: [
            {
              id: 'home',
              type: 'nested',
              index: true,
              component: HomePage,
              loader: ({ context }: any) => {
                loaderHadApplications =
                  typeof context?.applications?.discoverApplications ===
                  'function';
                return { hasApps: loaderHadApplications };
              },
            },
          ],
        },
      ],
    });
    registerRuntimeDefinition((context, instancePlugins) =>
      createRuntime(
        [mfApplicationsPlugin({ hooks: { default: load } }), routerPlugin({})],
        undefined,
        context,
        instancePlugins,
      ),
    );

    const ModernRoot = createModernRoot();
    const container = document.createElement('div');
    document.body.append(container);
    const root = await browserRender(<ModernRoot />, container);
    cleanups.push(() => {
      root.unmount();
      container.remove();
    });
    await tick(60);

    expect(container.textContent).toContain('Home:true');
    expect(loaderHadApplications).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);

    await nav('/shop/welcome');
    await tick(80);
    expect(container.textContent).toContain('Shop:cn:true');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('respects autoGenerateRoute=false by preparing metadata without installing routes', async () => {
    window.history.replaceState(null, '', '/shop/item');

    const instance = setupMockFederationHost({});
    const load = rs.fn(async () => ({
      routes: [
        {
          route: 'shop/*',
          moduleName: 'shop',
          expose: './App',
          versionOrUrl: 'https://cdn.example.com/shop/remoteEntry.js',
          discoverChildren: false,
        },
      ],
    }));

    function RootLayout() {
      const apps = useApplications();
      const routes = apps.getRoutesForMount('root');
      return (
        <div>
          <span data-testid="discovered-count">{routes.length}</span>
          <Outlet />
        </div>
      );
    }

    setGlobalContext({
      entryName: 'index',
      basename: '/',
      routes: [
        {
          id: 'root_layout',
          type: 'nested',
          isRoot: true,
          path: '/',
          component: RootLayout,
          children: [
            {
              id: 'fallback',
              type: 'nested',
              path: '*',
              component: () => <div>LocalFallback</div>,
            },
          ],
        },
      ],
    });
    registerRuntimeDefinition((context, instancePlugins) =>
      createRuntime(
        [
          mfApplicationsPlugin({
            hooks: { default: load },
            autoGenerateRoute: false,
          }),
          routerPlugin({}),
        ],
        undefined,
        context,
        instancePlugins,
      ),
    );

    const ModernRoot = createModernRoot();
    const container = document.createElement('div');
    document.body.append(container);
    const root = await browserRender(<ModernRoot />, container);
    cleanups.push(() => {
      root.unmount();
      container.remove();
    });
    await tick(60);

    expect(load).toHaveBeenCalledTimes(1);
    expect(instance.options.remotes.some(r => r.name === 'shop')).toBe(true);
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('LocalFallback');
  });

  it('hydrates from SSR script with 0 load() calls', async () => {
    window.history.replaceState(null, '', '/shop/page');
    setupMockFederationHost({
      'shop/App': {
        default: () => <div>HydratedShop</div>,
      },
    });

    const serialized: SerializedApplicationsState = {
      version: 1,
      target: { pathname: '/shop/page', search: '' },
      contexts: [
        {
          mountId: 'root',
          consumer: null,
          basename: '/',
          routes: [
            {
              route: 'shop/*',
              moduleName: 'shop',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/shop/remoteEntry.js',
              discoverChildren: false,
            },
          ],
        },
      ],
    };
    const script = document.createElement('script');
    script.id = APPLICATIONS_DATA_SCRIPT_ID;
    script.type = 'application/json';
    script.textContent = JSON.stringify(serialized);
    document.head.append(script);

    const load = rs.fn(async () => ({ routes: [] }));
    setGlobalContext({
      entryName: 'index',
      basename: '/',
      routes: [
        {
          id: 'root_layout',
          type: 'nested',
          isRoot: true,
          path: '/',
          component: () => <Outlet />,
        },
      ],
    });
    registerRuntimeDefinition((context, instancePlugins) =>
      createRuntime(
        [mfApplicationsPlugin({ hooks: { default: load } }), routerPlugin({})],
        undefined,
        context,
        instancePlugins,
      ),
    );

    const ModernRoot = createModernRoot();
    const container = document.createElement('div');
    document.body.append(container);
    const root = await browserRender(<ModernRoot />, container);
    cleanups.push(() => {
      root.unmount();
      container.remove();
    });
    await tick(80);

    expect(load).not.toHaveBeenCalled();
    expect(container.textContent).toContain('HydratedShop');
  });

  it('isolates child Bridge routes by mountId and strips internal mount metadata from business props', async () => {
    window.history.replaceState(null, '', '/');

    setupMockFederationHost({
      'cn_rec/App': {
        default: () => <div>CN-Recommendation</div>,
      },
      'us_rec/App': {
        default: () => <div>US-Recommendation</div>,
      },
    });

    const load = async (ctx: any) => {
      if (!ctx.consumer) {
        return {
          routes: [
            {
              route: 'cn-shop/*',
              moduleName: 'shop',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/shop/remoteEntry.js',
              discoverChildren: true,
            },
            {
              route: 'us-shop/*',
              moduleName: 'shop',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/shop/remoteEntry.js',
              discoverChildren: true,
            },
          ],
        };
      }
      if (ctx.basename === '/cn-shop') {
        return {
          routes: [
            {
              route: 'rec/*',
              moduleName: 'cn_rec',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/cn_rec/remoteEntry.js',
              discoverChildren: false,
            },
          ],
        };
      }
      if (ctx.basename === '/us-shop') {
        return {
          routes: [
            {
              route: 'rec/*',
              moduleName: 'us_rec',
              expose: './App',
              versionOrUrl: 'https://cdn.example.com/us_rec/remoteEntry.js',
              discoverChildren: false,
            },
          ],
        };
      }
      return { routes: [] };
    };

    let appsService!: ReturnType<typeof useApplications>;
    setGlobalContext({
      entryName: 'index',
      basename: '/',
      routes: [
        {
          id: 'root_layout',
          type: 'nested',
          isRoot: true,
          path: '/',
          component: () => {
            appsService = useApplications();
            return <div>HostShell</div>;
          },
        },
      ],
    });
    registerRuntimeDefinition((context, instancePlugins) =>
      createRuntime(
        [
          mfApplicationsPlugin({
            hooks: { default: load },
            autoGenerateRoute: false,
          }),
          routerPlugin({}),
        ],
        undefined,
        context,
        instancePlugins,
      ),
    );

    const HostRoot = createModernRoot();
    const hostContainer = document.createElement('div');
    document.body.append(hostContainer);
    const hostRoot = await browserRender(<HostRoot />, hostContainer);
    cleanups.push(() => {
      hostRoot.unmount();
      hostContainer.remove();
    });
    await tick(50);

    const cnRes = await appsService.discoverApplications({
      pathname: '/cn-shop/rec',
    });
    const usRes = await appsService.discoverApplications({
      pathname: '/us-shop/rec',
    });
    const cnMountId = cnRes.contexts[1].mountId;
    const usMountId = usRes.contexts[1].mountId;
    expect(cnMountId).not.toBe(usMountId);

    window.history.replaceState(null, '', '/cn-shop/rec');

    const receivedProps: Array<Record<string, unknown>> = [];
    function ShopLayout(props: Record<string, unknown>) {
      receivedProps.push(props);
      return (
        <div>
          <span>ShopLayout</span>
          <Outlet />
        </div>
      );
    }

    const shopDefinition: ScopedRootDefinition = {
      routes: [
        {
          id: 'shop_root',
          type: 'nested',
          isRoot: true,
          path: '/',
          component: ShopLayout,
        },
      ],
      selected: true,
      basename: '/',
      serverLoaders: false,
      getDataBase: () => window.location.origin,
      createRuntime: (context, instancePlugins) =>
        createRuntime([routerPlugin({})], undefined, context, instancePlugins),
    };
    const ShopRoot = createScopedRoot(shopDefinition);

    const containerCN = document.createElement('div');
    const containerUS = document.createElement('div');
    document.body.append(containerCN, containerUS);

    const rootCN = await bridgeRender(
      <ShopRoot bizLabel="china" />,
      containerCN,
      {
        rootComponent: ShopRoot,
        memoryRoute: { entryPath: '/rec' },
        basename: '/cn-shop',
        bizLabel: 'china',
        [INTERNAL_MOUNT_ID_KEY]: cnMountId,
        [INTERNAL_CONSUMER_KEY]: {
          moduleName: 'shop',
          expose: './App',
          versionOrUrl: 'https://cdn.example.com/shop/remoteEntry.js',
        },
      },
    );
    const rootUS = await bridgeRender(
      <ShopRoot bizLabel="usa" />,
      containerUS,
      {
        rootComponent: ShopRoot,
        memoryRoute: { entryPath: '/rec' },
        basename: '/us-shop',
        bizLabel: 'usa',
        [INTERNAL_MOUNT_ID_KEY]: usMountId,
        [INTERNAL_CONSUMER_KEY]: {
          moduleName: 'shop',
          expose: './App',
          versionOrUrl: 'https://cdn.example.com/shop/remoteEntry.js',
        },
      },
    );
    cleanups.push(() => {
      rootCN.unmount();
      rootUS.unmount();
      containerCN.remove();
      containerUS.remove();
    });

    await tick(80);
    expect(containerCN.textContent).toContain('CN-Recommendation');
    expect(containerCN.textContent).not.toContain('US-Recommendation');
    expect(containerUS.textContent).toContain('US-Recommendation');
    expect(containerUS.textContent).not.toContain('CN-Recommendation');

    expect(receivedProps.length).toBeGreaterThanOrEqual(2);
    for (const p of receivedProps) {
      expect(INTERNAL_MOUNT_ID_KEY in p).toBe(false);
      expect(INTERNAL_CONSUMER_KEY in p).toBe(false);
    }
    expect(receivedProps.some(p => p.bizLabel === 'china')).toBe(true);
    expect(receivedProps.some(p => p.bizLabel === 'usa')).toBe(true);
  });
});
