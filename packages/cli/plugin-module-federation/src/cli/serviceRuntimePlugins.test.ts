import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { afterEach, expect, it, rs } from '@rstest/core';
import { ModuleFederation } from '@module-federation/enhanced/runtime';
import { bridgeServicePlugin } from '@module-federation/bridge-react/service-node';
import { buildServiceRuntimePlugins } from './serviceRuntimePlugins';
import {
  createServiceRuntimePluginLoader,
  denyServiceRuntimePluginAccess,
} from '../server/serviceRuntimePlugins';
import { createBridgeServiceIngressMiddleware } from '../server/service';
import { SERVICE_RUNTIME_PLUGINS_FILE } from '../servicePath';

const temporary: string[] = [];
afterEach(async () => {
  rs.restoreAllMocks();
  await Promise.all(
    temporary.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  );
});
const protocol = 'module-federation/bridge-ssr/producer/v1';
function snapshot(base = 'https://selected.test/') {
  return {
    version: 'selected',
    buildVersion: 'build-1',
    globalName: 'trusted-weather',
    remoteEntry: 'entry.js',
    remoteEntryType: 'global',
    publicPath: 'https://assets.test/',
    serviceBaseUrl: base,
    modules: [
      {
        moduleName: 'App',
        modulePath: './App',
        render: 'bridge',
        servicePath: 'render',
        assets: { js: { sync: [], async: [] }, css: { sync: [], async: [] } },
      },
    ],
    shared: [],
    remotesInfo: {},
  };
}
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mf-service-runtime-'));
  temporary.push(root);
  const app = path.join(root, 'app');
  const dist = path.join(app, 'dist');
  await mkdir(path.join(app, 'src'), { recursive: true });
  await writeFile(
    path.join(app, 'package.json'),
    JSON.stringify({ name: 'service-runtime-fixture', private: true }),
  );
  await writeFile(
    path.join(app, 'src/selected.ts'),
    `export const selected = ${JSON.stringify(snapshot())};`,
  );
  await writeFile(
    path.join(app, 'src/plugin.ts'),
    `import { selected } from '@selected';\nexport default (options: { name: string }) => { const snapshotRequests: string[] = []; return { name: options.name, snapshotRequests, loadSnapshot(args: any) { snapshotRequests.push(args.moduleInfo?.name); return { ...args, remoteSnapshot: selected }; } }; };`,
  );
  const build = () =>
    buildServiceRuntimePlugins({
      appDirectory: app,
      distDirectory: dist,
      plugins: [['./src/plugin.ts', { name: 'trusted-instance-selection' }]],
      alias: { '@selected': path.join(app, 'src/selected.ts') },
    });
  return { root, app, dist, build };
}
function response(prefix: string) {
  return new Response(
    [
      {
        type: 'meta',
        protocol,
        buildVersion: 'build-1',
        identifierPrefix: prefix,
        hydration: 'progressive',
      },
      { type: 'html', html: '<p>selected weather</p>' },
      { type: 'ready', snapshot: {} },
      { type: 'done' },
    ]
      .map(value => JSON.stringify(value))
      .join('\n') + '\n',
    { headers: { 'content-type': 'application/x-ndjson' } },
  );
}

it('bundles a TS plugin graph and its options into a movable artifact for independent SSR and CSR discovery', async () => {
  const fixtureInfo = await fixture();
  await fixtureInfo.build();
  const deployed = path.join(fixtureInfo.root, 'deployed');
  await cp(fixtureInfo.dist, deployed, { recursive: true });
  await rm(fixtureInfo.app, { recursive: true, force: true });
  const load = createServiceRuntimePluginLoader(
    deployed,
    SERVICE_RUNTIME_PLUGINS_FILE,
  )!;
  const plugins = await load();
  expect(plugins[0].name).toBe('trusted-instance-selection');
  expect(await load()).toBe(plugins);
  const fetcher = rs
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (url, init) => {
      expect(String(url)).toBe('https://selected.test/render');
      return response(JSON.parse(String(init?.body)).request.identifierPrefix);
    });
  const remote = {
    name: `trusted-weather-${randomUUID()}`,
    alias: 'weather',
    entry: `https://unavailable.test/${randomUUID()}/mf-manifest.json`,
  };
  const runtime = new ModuleFederation({
    name: `compiled-ssr-${randomUUID()}`,
    inBrowser: false,
    shareStrategy: 'loaded-first',
    remotes: [remote],
    plugins: [...plugins, bridgeServicePlugin()],
  });
  const provider = await runtime.loadRemote<any>('weather/App');
  const result = await provider.default().renderStream({
    moduleName: 'weather/App',
    instanceId: 'ssr',
    identifierPrefix: 'ssr-',
    url: 'https://host.test/page',
    props: {},
    signal: new AbortController().signal,
  });
  const reader = result.messages.getReader();
  while (!(await reader.read()).done) {}
  reader.releaseLock();
  expect(
    (plugins[0] as (typeof plugins)[0] & { snapshotRequests: string[] })
      .snapshotRequests,
  ).toEqual([remote.name]);
  // This uses an independent scoped runtime, with no SSR bundle or global plugin.
  const csrRemote = {
    ...remote,
    name: `trusted-csr-weather-${randomUUID()}`,
    entry: `https://unavailable.test/${randomUUID()}/mf-manifest.json`,
  };
  const csrLoad = createServiceRuntimePluginLoader(
    deployed,
    SERVICE_RUNTIME_PLUGINS_FILE,
  )!;
  const csrPlugins = await csrLoad();
  const ingress = createBridgeServiceIngressMiddleware(
    {},
    {
      name: `compiled-csr-${randomUUID()}`,
      remotes: [csrRemote],
      plugins: csrLoad,
    },
  );
  const request = new Request(
    'https://host.test/_modern/mf/service/weather%2FApp',
    {
      method: 'POST',
      headers: { origin: 'https://host.test' },
      body: JSON.stringify({
        protocol,
        buildVersion: 'build-1',
        request: {
          moduleName: 'weather/App',
          instanceId: 'csr',
          identifierPrefix: 'csr-',
          url: 'https://host.test/page',
          props: {},
        },
      }),
    },
  );
  const output = await ingress({ req: { raw: request } }, async () => {});
  expect(output?.status).toBe(200);
  expect(await output!.text()).toContain('selected weather');
  expect(
    (csrPlugins[0] as (typeof csrPlugins)[0] & { snapshotRequests: string[] })
      .snapshotRequests,
  ).toEqual([csrRemote.name]);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('waits for the latest dev build, replaces plugin instances only after success, and keeps build failures visible', async () => {
  const info = await fixture();
  const linkedDist = path.join(info.root, 'linked-dist');
  await symlink(info.dist, linkedDist, 'junction');
  // Exercise the native Node module cache through a symlinked deployment path.
  const child = await promisify(execFile)(process.execPath, [
    '-e',
    `
    const assert = require('node:assert/strict');
    const path = require('node:path');
    const { writeFile } = require('node:fs/promises');
    const input = JSON.parse(process.argv[1]);
    const jiti = require(input.jiti).createJiti(input.builder, { fsCache: false });
    (async () => {
      const { buildServiceRuntimePlugins } = await jiti.import(input.builder);
      const { createServiceRuntimePluginLoader } = await jiti.import(input.loader);
      const build = () => buildServiceRuntimePlugins({
        appDirectory: input.app, distDirectory: input.dist,
        plugins: [['./src/plugin.ts', { name: 'trusted-instance-selection' }]],
        alias: { '@selected': path.join(input.app, 'src/selected.ts') },
        development: true,
      });
      await build();
      let pending = Promise.resolve();
      const load = createServiceRuntimePluginLoader(input.linkedDist, input.filename, () => pending);
      const initial = await load();
      assert.strictEqual(await load(), initial);
      assert.equal((await initial[0].loadSnapshot({})).remoteSnapshot.serviceBaseUrl, 'https://selected.test/');
      let finish;
      pending = new Promise(resolve => { finish = resolve; });
      let completed = false;
      const waiting = load().then(value => { completed = true; return value; });
      await Promise.resolve();
      assert.equal(completed, false);
      await writeFile(path.join(input.app, 'src/selected.ts'), 'export const selected = ' + JSON.stringify(input.updated) + ';');
      await build();
      finish();
      const updated = await waiting;
      assert.notStrictEqual(updated, initial);
      assert.equal((await updated[0].loadSnapshot({})).remoteSnapshot.serviceBaseUrl, 'https://updated.test/');
      assert.strictEqual(await load(), updated);
      pending = Promise.reject(Error('plugin compilation failed'));
      await assert.rejects(load(), /plugin compilation failed/);
      console.log('Verified native Node plugin reload and build barrier');
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `,
    JSON.stringify({
      jiti: createRequire(__filename).resolve('jiti'),
      builder: path.join(__dirname, 'serviceRuntimePlugins.ts'),
      loader: path.join(__dirname, '../server/serviceRuntimePlugins.ts'),
      app: info.app,
      dist: info.dist,
      linkedDist,
      filename: SERVICE_RUNTIME_PLUGINS_FILE,
      updated: snapshot('https://updated.test/'),
    }),
  ]);
  expect(child.stdout).toContain(
    'Verified native Node plugin reload and build barrier',
  );
});

it.each([
  '/server/mf-service-runtime/runtime.cjs',
  '/assets/server/mf-service-runtime/runtime.cjs',
  '/assets/server%2Fmf-service-runtime%2Fruntime.cjs',
  '/assets/server/mf-service-runtime/extra.cjs',
])(
  'denies the private artifact before broad static routes: %s',
  async pathname => {
    const next = rs.fn();
    const result = await denyServiceRuntimePluginAccess(
      { req: { raw: new Request(`https://host.test${pathname}`) } } as any,
      next,
    );
    expect((result as Response).status).toBe(404);
    expect(next).not.toHaveBeenCalled();
  },
);
