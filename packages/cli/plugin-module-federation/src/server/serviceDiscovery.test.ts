import { afterEach, expect, it, rs } from '@rstest/core';
import {
  createInstance,
  helpers,
  type ModuleFederation,
  type ModuleFederationRuntimePlugin,
} from '@module-federation/enhanced/runtime';
import { getNodeInstanceLifecycle } from '@module-federation/node/lifecycle';
import { createBridgeServiceIngressMiddleware } from './service';

const scopes: ReturnType<typeof createBridgeServiceIngressMiddleware>[] = [];
const providers: ModuleFederation[] = [];
afterEach(async () => {
  for (const ingress of scopes.splice(0)) await ingress.dispose();
  const instances = helpers.global.Global.__FEDERATION__.__INSTANCES__;
  for (const provider of providers.splice(0)) {
    const index = instances.indexOf(provider);
    if (index !== -1) instances.splice(index, 1);
    const shares = helpers.share.getGlobalShareScope();
    for (const [id, scope] of Object.entries(shares))
      if (scope === provider.shareScopeMap) delete shares[id];
  }
});

function invoke(
  ingress: ReturnType<typeof createBridgeServiceIngressMiddleware>,
) {
  return ingress(
    {
      get: () => undefined,
      req: {
        raw: new Request('https://host.test/_modern/mf/service/catalog%2FApp', {
          method: 'POST',
          headers: { origin: 'https://host.test' },
          body: JSON.stringify({
            protocol: 'module-federation/bridge-ssr/producer/v1',
            buildVersion: 'old-browser',
            request: {
              moduleName: 'catalog/App',
              instanceId: 'app',
              identifierPrefix: 'app-',
              basename: '/',
              url: 'https://host.test/',
              props: {},
            },
          }),
        }),
      },
    },
    async () => {},
  );
}
function snapshotPlugin(
  name: string,
  hooks: Partial<ModuleFederationRuntimePlugin> = {},
): ModuleFederationRuntimePlugin {
  return {
    name,
    loadSnapshot(args) {
      return {
        ...args,
        remoteSnapshot: {
          version: 'https://producer.test/manifest.json',
          buildVersion: 'current',
          remoteEntry: 'entry.js',
          ssrRemoteEntry: 'node.js',
          remotesInfo: {},
          serviceBaseUrl: 'https://producer.test/',
          modules: [
            {
              moduleName: 'App',
              modulePath: './App',
              render: 'bridge',
              servicePath: 'render',
              assets: {
                js: { sync: [], async: [] },
                css: { sync: [], async: [] },
              },
            },
          ],
        },
      };
    },
    ...hooks,
  };
}
function ingress(plugins: () => Promise<ModuleFederationRuntimePlugin[]>) {
  const middleware = createBridgeServiceIngressMiddleware(
    {},
    {
      name: 'discovery-consumer',
      remotes: [
        { name: 'catalog', entry: 'https://producer.test/manifest.json' },
      ],
      plugins,
    },
  );
  scopes.push(middleware);
  return middleware;
}

it('releases discovery plugins and local metadata without retiring an existing producer', async () => {
  const provider = createInstance({ name: 'catalog', id: 'catalog:current' });
  providers.push(provider);
  const container = { __webpack_clear_cache__: rs.fn() };
  (globalThis as any).discoveryCatalogContainer = container;
  let discovery: ModuleFederation | undefined;
  const disposed = rs.fn();
  const plugins = [
    snapshotPlugin('discovery-lifetime', {
      apply(instance) {
        discovery = instance;
      },
      dispose(args) {
        disposed(args.origin);
      },
    }),
  ];
  const middleware = ingress(async () => plugins);
  try {
    expect((await invoke(middleware))?.status).toBe(409);
    expect(discovery!.moduleCache.size).toBe(1);
    expect(getNodeInstanceLifecycle(discovery!)).toBeUndefined();
    const ownedShareScope = discovery!.shareScopeMap;
    expect(Object.values(helpers.share.getGlobalShareScope())).toContain(
      ownedShareScope,
    );
    expect(helpers.global.getGlobalSnapshot()[discovery!.name]).toBeDefined();
    await middleware.dispose();
    expect(Object.values(helpers.share.getGlobalShareScope())).not.toContain(
      ownedShareScope,
    );
    expect(Object.values(helpers.share.getGlobalShareScope())).toContain(
      provider.shareScopeMap,
    );
    expect(helpers.global.getGlobalSnapshot()[discovery!.name]).toBeUndefined();
    expect(disposed).toHaveBeenCalledExactlyOnceWith(discovery);
    expect(discovery!.moduleCache.size).toBe(0);
    expect(helpers.global.Global.__FEDERATION__.__INSTANCES__).toContain(
      provider,
    );
    expect(container.__webpack_clear_cache__).not.toHaveBeenCalled();
    expect((globalThis as any).discoveryCatalogContainer).toBe(container);
  } finally {
    delete (globalThis as any).discoveryCatalogContainer;
  }
});

it('waits for in-flight discovery before releasing a replaced plugin scope', async () => {
  let unblock!: () => void;
  const blocked = new Promise<void>(resolve => {
    unblock = resolve;
  });
  let entered!: () => void;
  const started = new Promise<void>(resolve => {
    entered = resolve;
  });
  const firstDisposed = rs.fn();
  const secondDisposed = rs.fn();
  const secondApplied = rs.fn();
  const first = snapshotPlugin('discovery-first', {
    async loadSnapshot(args) {
      entered();
      await blocked;
      return snapshotPlugin('snapshot').loadSnapshot!(args);
    },
    dispose: firstDisposed,
  });
  let plugins = [first];
  const middleware = ingress(async () => plugins);
  const oldRequest = invoke(middleware);
  await started;
  plugins = [
    snapshotPlugin('discovery-second', {
      apply: secondApplied,
      dispose: secondDisposed,
    }),
  ];
  const newRequest = invoke(middleware);
  await Promise.resolve();
  await Promise.resolve();
  expect(firstDisposed).not.toHaveBeenCalled();
  expect(secondApplied).not.toHaveBeenCalled();
  unblock();
  expect((await oldRequest)?.status).toBe(409);
  expect((await newRequest)?.status).toBe(409);
  expect(firstDisposed).toHaveBeenCalledTimes(1);
  expect(secondApplied).toHaveBeenCalledTimes(1);
  await middleware.dispose();
  expect(firstDisposed).toHaveBeenCalledTimes(1);
  expect(secondDisposed).toHaveBeenCalledTimes(1);
});

it('keeps a failed discovery cleanup reachable for retry and notifies every plugin', async () => {
  let fail = true;
  const first = rs.fn(() => {
    if (fail) throw new Error('cleanup failed');
  });
  const second = rs.fn();
  const plugins = [
    snapshotPlugin('cleanup-first', { dispose: first }),
    { name: 'cleanup-second', dispose: second },
  ];
  const middleware = ingress(async () => plugins);
  expect((await invoke(middleware))?.status).toBe(409);
  await expect(middleware.dispose()).rejects.toThrow();
  expect(second).toHaveBeenCalledTimes(1);
  fail = false;
  await middleware.dispose();
  expect(first).toHaveBeenCalledTimes(2);
  expect(second).toHaveBeenCalledTimes(2);
});
