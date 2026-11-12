process.env.NODE_ENV = 'production';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const { packageRequire, packageAudit } = require('./packages.cjs');
const { createProdServer } = packageRequire('@modern-js/prod-server');
const { createSSRUpdateServerPlugin } = packageRequire(
  '@modern-js/plugin-module-federation/ssr-update',
);
const deferred = () => {
  let resolve;
  const promise = new Promise(done => (resolve = done));
  return { promise, resolve };
};
async function close(server) {
  if (!server?.listening) return;
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
}

(async () => {
  const root = await fs.mkdtemp(
    path.join(require('node:os').tmpdir(), 'mf-identity-'),
  );
  console.log('Identity fixture', root);
  const apps = [];
  const held = deferred();
  const entered = deferred();
  let pendingRequest;
  const asset = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://asset.invalid').pathname;
      const file = path.resolve(root, 'releases', `.${pathname}`);
      if (!file.startsWith(path.join(root, 'releases') + path.sep))
        throw Error();
      response.setHeader(
        'Content-Type',
        file.endsWith('.json') ? 'application/json' : 'application/javascript',
      );
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
    const build = spawn(
      process.execPath,
      [path.join(__dirname, 'production-fixture.cjs')],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          SSR_CACHE_PRODUCTION_DIR: root,
          SSR_CACHE_ASSET_URL: assetURL,
          SSR_CACHE_IDENTITY: '1',
          SSR_CACHE_FORMAL_API: '1',
        },
      },
    );
    const [code, signal] = await once(build, 'exit');
    assert.equal(code, 0, `Build failed: ${code ?? signal}`);
    const target = version => ({
      name: 'remote',
      entry: `${assetURL}/${version}/mf-manifest.json`,
    });
    for (const [directory, version, port] of [
      ['host', 'v1', process.env.JO_PORT_HOST],
      ['host-b', 'v2', process.env.JO_PORT_HOST_B],
    ]) {
      const app = { directory, version };
      apps.push(app);
      const plugin = createSSRUpdateServerPlugin({
        name: 'r6_host',
        remotes: [{ ...target(version), name: 'r6_remote', alias: 'remote' }],
        application: { requestTimeoutMs: 5000, drainTimeoutMs: 5000 },
        onReady(manager) {
          app.manager = manager;
        },
      });
      app.server = await createProdServer({
        pwd: path.join(root, directory, 'dist'),
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
          await fs.readFile(path.join(root, directory, 'dist/route.json')),
        ).routes,
        plugins: [plugin],
      });
      app.server.listen(Number(port), '127.0.0.1');
      await once(app.server, 'listening');
      assert.equal(app.server.address().port, Number(port));
      app.url = `http://127.0.0.1:${app.server.address().port}`;
    }
    const [a, b] = apps;
    const readPage = async (app, version) => {
      const response = await fetch(app.url);
      const html = await response.text();
      await fs.writeFile(
        path.join(root, `${app.directory}-${version}.html`),
        html,
      );
      await fs.writeFile(
        path.join(root, 'instances.json'),
        JSON.stringify(
          globalThis.__FEDERATION__.__INSTANCES__.map(instance => ({
            name: instance.name,
            id: instance.options.id,
            remotes: instance.options.remotes,
            modules: [...instance.moduleCache.values()].map(
              module => module.remoteInfo,
            ),
          })),
          null,
          2,
        ),
      );
      assert.equal(response.status, 200, html);
      assert.match(html, new RegExp(`id="remote-counter"[^>]*>${version}:`));
      return html;
    };
    await readPage(a, 'v1');
    await readPage(b, 'v2');
    const instances = () => globalThis.__FEDERATION__.__INSTANCES__;
    const host = version =>
      instances().find(
        instance => instance.options.id === `r6_host:${version}`,
      );
    const originalA = host('host-a');
    const originalB = host('host-b');
    assert.ok(
      originalA && originalB && originalA !== originalB,
      'Same-name builds must own distinct MF instances',
    );
    assert.equal(
      originalA.moduleCache.get('r6_remote').remoteInfo.buildVersion,
      'v1',
    );
    assert.equal(
      originalB.moduleCache.get('r6_remote').remoteInfo.buildVersion,
      'v2',
    );
    const originalBModule = originalB.moduleCache.get('r6_remote');
    const providers = instances().filter(instance =>
      ['r6_remote:v1', 'r6_remote:v2'].includes(instance.options.id),
    );
    assert.equal(providers.length, 2);
    const disposedProviders = new Set();
    for (const provider of providers)
      provider.registerPlugins([
        {
          name: `identity-disposal-${provider.options.id}`,
          dispose() {
            disposedProviders.add(provider);
          },
        },
      ]);
    const { shouldUpdateRemote } = globalThis.__r6FormalMF;
    await assert.rejects(
      shouldUpdateRemote(target('v1'), { application: 'r6_host' }),
      /ambiguous|multiple/i,
    );
    const selections = [];
    globalThis.__r6Loader = async request => {
      if (request.headers.get('x-check-owner') === '1')
        selections.push(await shouldUpdateRemote(target('v1')));
      if (request.headers.get('x-hold-owner') === 'b') {
        entered.resolve();
        await held.promise;
      }
    };
    for (const app of apps) {
      const response = await fetch(`${app.url}/?__loader=page`, {
        headers: { 'x-check-owner': '1' },
      });
      assert.equal(response.status, 200, await response.text());
    }
    assert.deepEqual(
      selections,
      [false, true],
      'Request context must select its own same-name manager',
    );
    pendingRequest = fetch(`${b.url}/?__loader=page`, {
      headers: { 'x-hold-owner': 'b' },
    });
    await entered.promise;
    const update = await a.manager.updateRemotes([target('v2')]);
    assert.equal(update.changed, true);
    assert.equal(host('host-b'), originalB, 'Updating A replaced B runtime');
    assert.equal(originalB.disposed, false);
    assert.equal(
      originalB.moduleCache.get('r6_remote'),
      originalBModule,
      'Updating A cleared B remote cache',
    );
    assert.notEqual(
      host('host-a'),
      originalA,
      'A retained its old application root',
    );
    held.resolve();
    const heldResponse = await pendingRequest;
    assert.equal(heldResponse.status, 200, await heldResponse.text());
    await readPage(a, 'v2');
    await readPage(b, 'v2');
    await a.manager.updateRemotes([target('v1')]);
    await readPage(a, 'v1');
    await readPage(b, 'v2');
    assert.equal(originalB.moduleCache.get('r6_remote'), originalBModule);
    assert.ok(
      instances().includes(
        providers.find(provider => provider.options.id === 'r6_remote:v2'),
      ),
      'Leaving a shared provider retired the runtime still owned by B',
    );
    await close(a.server);
    await a.manager.close();
    assert.equal(host('host-b'), originalB, 'Closing A retired B runtime');
    await readPage(b, 'v2');
    await b.manager.updateRemotes([target('v1')]);
    await readPage(b, 'v1');
    await close(b.server);
    await b.manager.close();
    for (const provider of providers)
      assert.ok(
        disposedProviders.has(provider),
        `Provider never disposed after both owners closed: ${provider.options.id}`,
      );
    assert.deepEqual(
      instances().filter(instance =>
        ['r6_host', 'r6_remote'].includes(instance.name),
      ),
      [],
      'Closed fixture applications retained global instances',
    );
    assert.deepEqual(
      Object.keys(globalThis.__FEDERATION__.__SHARE__).filter(id =>
        /^(r6_host|r6_remote):/.test(id),
      ),
      [],
      'Closed fixture applications retained shared roots',
    );
    assert.deepEqual(
      Object.keys(globalThis.__FEDERATION__.moduleInfo).filter(id =>
        /^(r6_host|r6_remote)(:|$)/.test(id),
      ),
      [],
      'Closed fixture applications retained host or remote snapshots',
    );
    const result = {
      passed: true,
      packages: packageAudit(),
      sameNameBuildsAreDistinct: true,
      requestOwnersSelectTheirOwnManager: selections,
      independentPendingRequestAndCacheSurvived: true,
      sharedProviderSurvivedSiblingSwitchingAway: true,
      remainingApplicationUpdatedAfterSiblingClosed: true,
      allProviderDisposalsCompleted: true,
    };
    await fs.writeFile(
      path.join(root, 'result.json'),
      JSON.stringify(result, null, 2),
    );
    console.log('Identity isolation passed:', path.join(root, 'result.json'));
  } finally {
    held.resolve();
    await pendingRequest
      ?.then(response => response.body?.cancel())
      .catch(() => {});
    delete globalThis.__r6Loader;
    delete globalThis.__r6FormalMF;
    for (const app of apps) {
      await close(app.server);
      await app.manager?.close();
    }
    await close(asset);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
