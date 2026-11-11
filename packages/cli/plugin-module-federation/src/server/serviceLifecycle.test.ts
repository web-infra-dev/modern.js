import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from '@rstest/core';
import type { Manifest } from '@module-federation/sdk';
import type { ModuleFederation } from '@module-federation/enhanced/runtime';
import { createBridgeServiceMiddleware } from './service';

const handlers: ReturnType<typeof createBridgeServiceMiddleware>[] = [];
afterEach(async () => {
  await Promise.all(handlers.splice(0).map(handler => handler.dispose()));
});

function fixture() {
  const name = `service_lifecycle_${randomUUID().replaceAll('-', '')}`;
  const manifest: Manifest = {
    id: name,
    name,
    metaData: {
      name,
      globalName: name,
      type: 'app',
      publicPath: 'https://service.invalid/assets/',
      ssrPublicPath: 'https://service.invalid/server/',
      serviceBaseUrl: 'https://service.invalid/',
      buildInfo: { buildName: name, buildVersion: 'current-build' },
      remoteEntry: { name: 'browser.js', path: '', type: 'global' },
      ssrRemoteEntry: {
        name: 'remoteEntry.js',
        path: '',
        type: 'commonjs-module',
      },
    },
    exposes: [
      {
        id: `${name}:App`,
        name: 'App',
        path: './App',
        render: 'bridge',
        servicePath: 'render',
        assets: {
          js: { sync: [], async: [] },
          css: { sync: [], async: [] },
        },
      },
    ],
    shared: [],
    remotes: [],
  };
  const create = () => {
    const handler = createBridgeServiceMiddleware({
      path: '/render',
      module: `${name}/App`,
      manifest: {
        url: 'https://service.invalid/mf-manifest.json',
        data: manifest,
      },
    });
    handlers.push(handler);
    return handler;
  };
  const invoke = (handler: ReturnType<typeof create>) =>
    handler(
      {
        get: () => undefined,
        req: {
          raw: new Request('https://service.invalid/render', {
            method: 'POST',
            body: JSON.stringify({
              protocol: 'module-federation/bridge-ssr/producer/v1',
              buildVersion: 'old-build',
              request: {
                instanceId: 'app',
                identifierPrefix: 'app-',
                moduleName: `${name}/App`,
                url: 'https://host.invalid/page',
                props: {},
              },
            }),
          }),
        },
      },
      async () => {
        throw Error('Unexpected middleware fallthrough.');
      },
    );
  const instances = () =>
    (
      (globalThis as any).__FEDERATION__.__INSTANCES__ as ModuleFederation[]
    ).filter(instance => instance.name.startsWith(`modern_service_${name}`));
  return { name, manifest, create, invoke, instances };
}

describe('Service deployment runtime ownership', () => {
  it('gives two deployments of the same remote independent owners and can dispose one while the other stays active', async () => {
    const f = fixture();
    const first = f.create();
    const second = f.create();
    expect((await f.invoke(first))?.status).toBe(409);
    expect((await f.invoke(second))?.status).toBe(409);
    const instances = f.instances();
    expect(instances).toHaveLength(2);
    expect(new Set(instances.map(instance => instance.name)).size).toBe(2);
    for (const instance of instances)
      expect(instance.options.remotes.map(remote => remote.name)).toEqual([
        f.name,
      ]);
    await first.dispose();
    expect(f.instances()).toHaveLength(1);
    expect((await f.invoke(second))?.status).toBe(409);
    await second.dispose();
    expect(f.instances()).toHaveLength(0);
  });

  it('releases a runtime created by failed preparation before retrying with repaired metadata', async () => {
    const f = fixture();
    delete f.manifest.exposes[0].servicePath;
    const handler = f.create();
    await expect(f.invoke(handler)).rejects.toThrow(
      'Service deployment requires',
    );
    expect(f.instances()).toHaveLength(0);
    f.manifest.exposes[0].servicePath = 'render';
    expect((await f.invoke(handler))?.status).toBe(409);
    expect(f.instances()).toHaveLength(1);
    await handler.dispose();
    expect(f.instances()).toHaveLength(0);
  });
});
