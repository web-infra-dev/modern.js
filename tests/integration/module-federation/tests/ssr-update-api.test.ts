import { test, beforeAll, afterAll } from '@rstest/core';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import {
  nodeRequire,
  packageRequire,
  packageAudit,
} from './ssr-update/packages.mjs';
import { buildProductionFixture } from './ssr-update/production-fixture.mjs';
import { updatePorts } from './ssr-update/ports.mjs';
const state = globalThis as any;
const previousNodeEnv = process.env.NODE_ENV;
beforeAll(() => {
  process.env.NODE_ENV = 'production';
});
afterAll(() => {
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
});

async function close(server) {
  if (!server?.listening) return;
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
}
async function waitFor(
  check,
  message = 'Deferred publication did not complete',
) {
  const deadline = Date.now() + 10000;
  while (!(await check())) {
    assert.ok(Date.now() < deadline, message);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

test.each([false, true])(
  'production cache updates with asyncStartup=%s support no-op, rollback and deferred publication',
  verifyProductionUpdate,
  600000,
);

async function verifyProductionUpdate(asyncStartup: boolean) {
  const ports = await updatePorts();
  const { createProdServer } = packageRequire('@modern-js/prod-server');
  const { createSSRUpdateServerPlugin } = packageRequire(
    '@modern-js/plugin-module-federation/ssr-update',
  );

  const root = await fs.mkdtemp(path.join(tmpdir(), 'mf-formal-production-'));
  console.log('Formal production fixture', root);
  await fs.writeFile(
    path.join(root, 'packages.json'),
    JSON.stringify(packageAudit(), null, 2),
  );
  let published = 'v1';
  let manifestReads = 0;
  let server: any;
  let manager: any;
  let flipDuringUpdate = false;
  let pinnedDuringUpdate = false;
  let releaseDelayedChunk!: () => void;
  const delayedChunk = new Promise<void>(resolve => {
    releaseDelayedChunk = resolve;
  });
  let waitingForChunk = false;
  let delayedPage: Promise<string> | undefined;
  let publication: Promise<any> | undefined;
  const asset = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://asset.invalid').pathname;
      const requested =
        pathname === '/current/mf-manifest.json'
          ? `/${published}/mf-manifest.json`
          : pathname;
      if (pathname === '/current/mf-manifest.json') manifestReads++;
      const file = path.resolve(root, 'releases', `.${requested}`);
      if (!file.startsWith(path.join(root, 'releases') + path.sep))
        throw Error('Invalid asset path');
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader(
        'Content-Type',
        file.endsWith('.json') ? 'application/json' : 'application/javascript',
      );
      response.setHeader('Cache-Control', 'no-store');
      if (
        requested.startsWith('/v1/bundles/') &&
        requested.includes('__federation_expose_Delayed')
      ) {
        waitingForChunk = true;
        await delayedChunk;
      }
      response.end(await fs.readFile(file));
    } catch {
      response.statusCode = 404;
      response.end('Missing asset');
    }
  });
  try {
    asset.listen(ports.assets, '127.0.0.1');
    await once(asset, 'listening');
    const assetURL = `http://127.0.0.1:${(asset.address() as AddressInfo).port}`;
    const entry = `${assetURL}/current/mf-manifest.json`;
    await buildProductionFixture({
      root,
      assetURL,
      manifestURL: entry,
      formalAPI: true,
      asyncStartup,
    });
    const initial = { name: 'r6_remote', alias: 'remote', entry };
    const target = version => ({
      name: 'remote',
      entry,
      client: { entry: `${assetURL}/${version}/mf-manifest.json` },
    });
    const plugin = createSSRUpdateServerPlugin({
      name: 'r6_host',
      remotes: [initial],
      hydration: {
        remotes: [
          { name: 'r6_remote', entry: `${assetURL}/v1/mf-manifest.json` },
        ],
      },
      application: { requestTimeoutMs: 5000, drainTimeoutMs: 5000 },
      onReady(value) {
        manager = value;
      },
      async invalidate(targets) {
        if (!flipDuringUpdate) return;
        flipDuringUpdate = false;
        assert.match(targets[0].moduleInfo.metaData.publicPath, /\/v2\//);
        // A later publication arrives after the operation captured v2. The
        // chosen operation must still use v2, not reread this live endpoint.
        published = 'v1';
        pinnedDuringUpdate = true;
      },
    });
    server = await createProdServer({
      pwd: path.join(root, 'host/dist'),
      serverConfigPath: path.join(root, 'missing-config'),
      config: {
        server: { ssr: true },
        output: {},
        source: {},
        tools: {},
        html: {},
        bff: {},
        dev: {},
        security: {},
      },
      appContext: { apiDirectory: '', lambdaDirectory: '' },
      routes: JSON.parse(
        await fs.readFile(path.join(root, 'host/dist/route.json'), 'utf8'),
      ).routes,
      plugins: [plugin],
    });
    server.listen(ports.host, '127.0.0.1');
    await once(server, 'listening');
    const hostURL = `http://127.0.0.1:${server.address().port}`;
    const address = server.address();
    const pid = process.pid;
    const readPage = async expected => {
      const response = await fetch(hostURL);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.ok(
        html.includes(`>${expected}:`),
        `Expected ${expected} Counter in HTML`,
      );
      const match = html.match(/data-modern-mf-release>(.*?)<\/script>/);
      assert.ok(
        match,
        'Automatic SSR owner did not publish browser release metadata',
      );
      const release = JSON.parse(match[1]);
      assert.ok(
        release.remotes.some(
          remote => remote.entry === `${assetURL}/${expected}/mf-manifest.json`,
        ),
      );
      return html;
    };
    await readPage('v1');
    assert.ok(manager, 'Automatic server owner was not registered');
    // These functions are imported from the public entry by the real compiled
    // Modern page loader. The fixture exposes references for its release driver.
    const { shouldUpdateRemote, updateRemotes } = state.__r6FormalMF;
    const runtime = () =>
      state.__FEDERATION__.__INSTANCES__.find(
        instance => instance.name === 'r6_host',
      );
    const initialRuntime = runtime();
    assert.ok(initialRuntime);
    const bundlePath = path.join(root, 'host/dist/bundles/index.js');
    const startup = nodeRequire(bundlePath);
    const initialEntry = await startup;
    assert.equal(typeof initialEntry.loadSSR, 'function');
    const initialHandler = (await initialEntry.loadSSR()).requestHandler;
    assert.equal(
      await shouldUpdateRemote(
        { name: 'remote', entry },
        { application: 'r6_host', revalidate: true },
      ),
      false,
    );
    published = 'v2';
    const readsBeforeIdle = manifestReads;
    await new Promise(resolve => setTimeout(resolve, 1250));
    await readPage('v1');
    assert.equal(
      manifestReads,
      readsBeforeIdle,
      'Production unexpectedly polled the mutable manifest',
    );
    const check = shouldUpdateRemote(
      { name: 'remote', entry },
      { revalidate: true },
    );
    assert.equal(typeof check.then, 'function');
    assert.equal(await check, true);
    assert.equal(
      runtime(),
      initialRuntime,
      'Checking mutated the active runtime',
    );
    await readPage('v1');
    delayedPage = fetch(`${hostURL}/client`).then(response => response.text());
    void delayedPage.catch(() => {});
    await waitFor(
      () => waitingForChunk,
      'MF Node did not request the delayed producer chunk',
    );
    flipDuringUpdate = true;
    publication = updateRemotes([target('v2')], { revalidate: true });
    void publication.catch(() => {});
    await waitFor(() => manager.status()?.application.phase === 'draining');
    assert.equal(pinnedDuringUpdate, false);
    releaseDelayedChunk();
    assert.match(await delayedPage, /v1:delayed-remote/);
    const updated = await publication;
    assert.equal(updated.changed, true);
    assert.equal(updated.mode, 'entries', updated.reasons?.join(', '));
    assert.equal(nodeRequire(bundlePath), startup);
    assert.notEqual(
      (await initialEntry.loadSSR()).requestHandler,
      initialHandler,
    );
    assert.equal(pinnedDuringUpdate, true);
    assert.equal(published, 'v1');
    await readPage('v2');
    assert.match(
      await (await fetch(`${hostURL}/client`)).text(),
      /v2:delayed-remote/,
    );
    published = 'v2';
    assert.equal(
      await shouldUpdateRemote(target('v2'), { revalidate: true }),
      false,
    );
    const afterUpdateRuntime = runtime();
    const noOp = await updateRemotes([target('v2')], { revalidate: true });
    assert.equal(noOp.changed, false);
    assert.equal(runtime(), afterUpdateRuntime, 'No-op rebuilt the runtime');
    await readPage('v2');
    published = 'v1';
    const rollback = await updateRemotes([target('v1')], {
      revalidate: true,
    });
    assert.equal(rollback.changed, true);
    await readPage('v1');

    // The fixture's real page loader runs under the automatically selected
    // request owner, so it can submit a receipt without waiting on itself.
    let receipt: any;
    published = 'v2';
    state.__r6Loader = async request => {
      if (request.headers.get('x-formal-defer') !== '1') return;
      await assert.rejects(
        updateRemotes([target('v2')]),
        /Cannot update SSR from a request being drained/,
      );
      receipt = updateRemotes([target('v2')], { defer: 'after-response' });
      assert.equal(receipt.phase, 'scheduled');
      assert.equal(typeof receipt.then, 'undefined');
    };
    const loader = await fetch(`${hostURL}/?__loader=page`, {
      headers: { 'x-formal-defer': '1' },
    });
    const loaderBody = await loader.text();
    assert.equal(loader.status, 200, loaderBody);
    assert.match(loaderBody, /loader-ready/);
    assert.ok(receipt?.operationId);
    await waitFor(async () => {
      const status = manager.status();
      return (
        status?.operationId === receipt.operationId &&
        status.phase === 'applied'
      );
    });
    delete state.__r6Loader;
    await readPage('v2');
    for (let i = 0; i < 3; i++) {
      published = i % 2 === 0 ? 'v1' : 'v2';
      const result = await updateRemotes([target(published)], {
        revalidate: true,
      });
      assert.equal(result.mode, 'entries', result.reasons?.join(', '));
      assert.equal(nodeRequire(bundlePath), startup);
      await readPage(published);
    }
    assert.equal(process.pid, pid);
    assert.deepEqual(server.address(), address);
    const result = {
      passed: true,
      packages: packageAudit(),
      productionStayedV1UntilExplicitAPI: true,
      checkWasReadOnly: true,
      candidatePinnedDuringConcurrentPublication: pinnedDuringUpdate,
      updated,
      noOp,
      rollback,
      deferred: receipt,
    };
    await fs.writeFile(
      path.join(root, 'result.json'),
      JSON.stringify(result, null, 2),
    );
    console.log(
      'Formal production API acceptance passed:',
      path.join(root, 'result.json'),
    );
  } finally {
    releaseDelayedChunk();
    await Promise.allSettled([delayedPage, publication]);
    delete state.__r6Loader;
    delete state.__r6FormalMF;
    await close(server);
    await manager?.close();
    await close(asset);
  }
}
