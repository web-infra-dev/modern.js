process.env.NODE_ENV = 'production';
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const { packageRequire, packageAudit } = require('./packages.cjs');
const { createProdServer } = packageRequire('@modern-js/prod-server');
const { createSSRUpdateServerPlugin } = packageRequire(
  '@modern-js/plugin-module-federation/ssr-update',
);

async function close(server) {
  if (!server?.listening) return;
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
}
async function waitFor(check) {
  const deadline = Date.now() + 10000;
  while (!(await check())) {
    assert.ok(Date.now() < deadline, 'Deferred publication did not complete');
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

(async () => {
  const root = await fs.mkdtemp(
    path.join(require('node:os').tmpdir(), 'mf-formal-production-'),
  );
  console.log('Formal production fixture', root);
  await fs.writeFile(
    path.join(root, 'packages.json'),
    JSON.stringify(packageAudit(), null, 2),
  );
  let published = 'v1';
  let manifestReads = 0;
  let server;
  let manager;
  let flipDuringUpdate = false;
  let pinnedDuringUpdate = false;
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
      response.end(await fs.readFile(file));
    } catch {
      response.statusCode = 404;
      response.end('Missing asset');
    }
  });
  try {
    asset.listen(Number(process.env.JO_PORT_ASSETS), '127.0.0.1');
    await once(asset, 'listening');
    const assetURL = `http://127.0.0.1:${asset.address().port}`;
    const entry = `${assetURL}/current/mf-manifest.json`;
    const build = spawn(
      process.execPath,
      [path.join(__dirname, 'production-fixture.cjs')],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          SSR_CACHE_PRODUCTION_DIR: root,
          SSR_CACHE_ASSET_URL: assetURL,
          SSR_CACHE_REMOTE_MANIFEST_URL: entry,
          SSR_CACHE_FORMAL_API: '1',
        },
      },
    );
    const [code, signal] = await once(build, 'exit');
    assert.equal(code, 0, `Fixture build failed: ${code ?? signal}`);
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
        await fs.readFile(path.join(root, 'host/dist/route.json')),
      ).routes,
      plugins: [plugin],
    });
    server.listen(Number(process.env.JO_PORT_HOST), '127.0.0.1');
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
    const { shouldUpdateRemote, updateRemotes } = globalThis.__r6FormalMF;
    const runtime = () =>
      globalThis.__FEDERATION__.__INSTANCES__.find(
        instance => instance.name === 'r6_host',
      );
    const initialRuntime = runtime();
    assert.ok(initialRuntime);
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
    flipDuringUpdate = true;
    const updated = await updateRemotes([target('v2')], { revalidate: true });
    assert.equal(updated.changed, true);
    assert.equal(pinnedDuringUpdate, true);
    assert.equal(published, 'v1');
    await readPage('v2');
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
    const rollback = await updateRemotes([target('v1')], { revalidate: true });
    assert.equal(rollback.changed, true);
    await readPage('v1');

    // The fixture's real page loader runs under the automatically selected
    // request owner, so it can submit a receipt without waiting on itself.
    let receipt;
    published = 'v2';
    globalThis.__r6Loader = async request => {
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
    delete globalThis.__r6Loader;
    await readPage('v2');
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
    delete globalThis.__r6Loader;
    delete globalThis.__r6FormalMF;
    await close(server);
    await manager?.close();
    await close(asset);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
