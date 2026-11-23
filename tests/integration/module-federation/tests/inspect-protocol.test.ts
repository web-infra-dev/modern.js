import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { expect, test } from '@rstest/core';
import inspectPlugin from '../host/src/plugins/inspect';
import {
  nodeRequire,
  packageRequire,
  pluginRoot,
} from './ssr-update/packages.mjs';

const { createInstance } = packageRequire(
  '@module-federation/enhanced/runtime',
);
const { default: nodeRuntimePlugin } = packageRequire(
  '@module-federation/node/runtimePlugin',
);
const { destroyNodeInstance } = packageRequire(
  '@module-federation/node/lifecycle',
);
const {
  setSSRUpdateCandidates,
  createSSRUpdateSnapshotPlugin,
  clearSSRUpdateCandidates,
} = nodeRequire(
  path.join(pluginRoot, 'dist/cjs/server/ssrUpdateCandidates.js'),
);

test.each(['bridge', 'service'] as const)(
  'inspect preserves the %s provider selected by an application-owned snapshot',
  async kind => {
    const owner = `inspect_${randomUUID()}`;
    const name = `${owner}_provider`;
    const entry = 'https://producer.invalid/mf-manifest.json';
    const renderStream = () => ({
      stream: new ReadableStream({ start: controller => controller.close() }),
    });
    const provider = { renderStream };
    const factory = () => provider;
    const namespace = { default: factory };
    setSSRUpdateCandidates(owner, [
      {
        name,
        entry,
        manifest: {
          id: name,
          name,
          metaData: {
            name,
            globalName: name,
            type: 'app',
            publicPath: 'https://producer.invalid/v2/',
            ssrPublicPath: 'https://producer.invalid/v2/server/',
            ...(kind === 'service'
              ? { serviceBaseUrl: 'https://producer.invalid/' }
              : {}),
            buildInfo: { buildVersion: 'v2', buildName: name },
            remoteEntry: { name: 'browser.js', path: '', type: 'global' },
            ssrRemoteEntry: {
              name: 'server.js',
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
              ...(kind === 'service' ? { servicePath: 'weather-service' } : {}),
              assets: {
                js: { sync: [], async: [] },
                css: { sync: [], async: [] },
              },
            },
          ],
          shared: [],
          remotes: [],
        },
      },
    ]);
    const instance = createInstance({
      name: owner,
      remotes: [{ name, alias: 'provider', entry }],
      plugins: [
        nodeRuntimePlugin(),
        createSSRUpdateSnapshotPlugin(owner),
        {
          name: 'in-memory-provider',
          beforeLoadRemote: () => ({ factory: () => namespace }),
        },
        inspectPlugin(),
      ],
    });
    try {
      // Go through the real runtime's resolve, onLoad and namespace paths. No
      // network/global snapshot exists for this application-owned deployment.
      const loaded = await instance.loadRemote('provider/App');
      const remoteInfo = instance.moduleCache.get(name).remoteInfo;
      expect(
        instance.snapshotHandler.getGlobalRemoteInfo(remoteInfo).remoteSnapshot,
      ).toBeUndefined();
      expect(loaded.default).toBe(factory);
      expect(loaded.default()).toBe(provider);
      expect(loaded.default().renderStream).toBe(renderStream);
    } finally {
      await destroyNodeInstance(instance);
      clearSSRUpdateCandidates(owner);
    }
  },
);
