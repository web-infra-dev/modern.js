const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const { createProdServer } = require('../../prod-server/dist/cjs');

test('production server rebuilds dynamic MF remotes v1/v2/v3 with one control plane', async () => {
  assert.ok(
    process.env.SSR_CACHE_RSPACK_ENTRY,
    'Set the companion Rspack artifact entry',
  );
  assert.ok(
    process.env.SSR_CACHE_MF_ROOT,
    'Set the companion MF repository root',
  );
  const { rspack, container } = await import(
    pathToFileURL(process.env.SSR_CACHE_RSPACK_ENTRY).href
  );
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(tmpdir(), 'modern-mf-owner-')),
  );
  const out = path.join(root, 'dist');
  const implementation = path.join(
    process.env.SSR_CACHE_MF_ROOT,
    'packages/runtime-tools',
  );
  const write = (name, value) => fs.writeFile(path.join(root, name), value);
  await write('shared.js', 'export default { identity: "shared" };');
  for (const version of ['v1', 'v2', 'v3']) {
    await write(
      `${version}.js`,
      `${version === 'v1' ? 'globalThis.__modernOwnerMarker = "persist";' : ''} import shared from 'shared-lib'; export { shared }; export default '${version}';`,
    );
  }
  await write(
    'dynamic.js',
    'let saved; export async function render() { saved ||= await __webpack_require__.federation.instance.loadRemote("dynamic/Value"); return new Response(saved.default); }',
  );
  await write(
    'host.js',
    'export const req = __webpack_require__; export const share = () => import("shared-lib"); export const requestHandler = import("./dynamic").then(m => m.render);',
  );
  await write(
    'plugin.js',
    "module.exports=()=>({name:'local-entry',loadEntry({remoteInfo}) { return __non_webpack_require__(remoteInfo.entry); }});",
  );
  const common = {
    context: root,
    target: 'node',
    mode: 'production',
    devtool: false,
    optimization: { minimize: false, concatenateModules: false },
    output: {
      path: out,
      library: { type: 'commonjs2' },
      filename: '[name].cjs',
      chunkFilename: '[name].cjs',
    },
  };
  const configs = ['v1', 'v2', 'v3'].map(version => ({
    ...common,
    entry: {},
    output: { ...common.output, uniqueName: version },
    plugins: [
      new container.ModuleFederationPlugin({
        name: version,
        implementation,
        filename: `${version}.cjs`,
        library: { type: 'commonjs-module' },
        exposes: { './Value': `./${version}.js` },
        shared: {
          'shared-lib': {
            import: './shared.js',
            version: '1.0.0',
            singleton: true,
          },
        },
      }),
    ],
  }));
  configs.push({
    ...common,
    entry: { host: './host.js' },
    output: { ...common.output, uniqueName: 'modern-owner-host' },
    plugins: [
      new container.ModuleFederationPlugin({
        name: 'modern-owner-host',
        implementation,
        shared: {
          'shared-lib': {
            import: false,
            requiredVersion: false,
            singleton: true,
          },
        },
        remotes: { remote: { external: `v1@${path.join(out, 'v1.cjs')}` } },
        runtimePlugins: [path.join(root, 'plugin.js')],
      }),
    ],
  });
  const compiler = rspack(configs);
  try {
    await new Promise((resolve, reject) =>
      compiler.run((error, stats) =>
        error
          ? reject(error)
          : stats.hasErrors()
            ? reject(new Error(stats.toString({ all: false, errors: true })))
            : resolve(),
      ),
    );
  } finally {
    await new Promise((resolve, reject) =>
      compiler.close(error => (error ? reject(error) : resolve())),
    );
  }
  await fs.writeFile(path.join(out, 'index.html'), '<html>template</html>');
  const adapters = Symbol.for('module-federation.clear-cache.adapters');
  let application;
  let instance;
  let disposals = 0;
  let failValidation = false;
  const server = await createProdServer({
    pwd: out,
    serverConfigPath: path.join(out, 'missing-server-config'),
    appContext: { apiDirectory: '', lambdaDirectory: '' },
    config: {
      html: {},
      output: {},
      source: {},
      tools: {},
      server: { ssr: true },
      bff: {},
      dev: {},
      security: {},
    },
    routes: [
      {
        urlPath: '/',
        entryName: 'main',
        entryPath: 'index.html',
        bundle: 'host.cjs',
        isSSR: true,
      },
    ],
    ssrApplication: {
      maxPendingRequests: 4,
      requestTimeoutMs: 5000,
      drainTimeoutMs: 5000,
      onReady(value) {
        application = value;
      },
      async validate(resources) {
        const next =
          resources.serverManifest.renderBundles.main.req.federation.instance;
        if (instance) assert.equal(next, instance);
        else instance = next;
        assert.equal(instance[adapters].bindings.size, 1);
        if (failValidation) throw new Error('warmup failed');
      },
      async dispose() {
        for (const req of Array.from(instance[adapters]?.bindings || []))
          req.federation.disposeClearCache();
        disposals++;
        assert.equal(instance[adapters], undefined);
      },
    },
  });
  const remote = version => ({
    name: 'dynamic',
    entry: path.join(out, `${version}.cjs`),
    type: 'commonjs-module',
    entryGlobalName: version,
  });
  instance.registerRemotes([remote('v1')]);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const pid = process.pid;
  const url = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal(await (await fetch(url)).text(), 'v1');
    const shared = (await require(path.join(out, 'host.cjs')).share()).default;
    assert.equal((await instance.loadRemote('dynamic/Value')).shared, shared);
    for (const version of ['v2', 'v3']) {
      let release;
      const wait = new Promise(resolve => {
        release = resolve;
      });
      let entered;
      const closed = new Promise(resolve => {
        entered = resolve;
      });
      const updating = application.update(async () => {
        entered();
        await wait;
        await instance.removeRemote('dynamic');
        instance.registerRemotes([remote(version)]);
      });
      await closed;
      const queued = fetch(url);
      // Wait for real HTTP admission, not a timer-based assumption about fetch scheduling.
      const deadline = Date.now() + 3000;
      while (application.status.pendingRequests === 0 && Date.now() < deadline)
        await new Promise(resolve => setTimeout(resolve, 5));
      assert.equal(application.status.pendingRequests, 1);
      release();
      await updating;
      assert.equal(await (await queued).text(), version);
      const hostShared = (await require(path.join(out, 'host.cjs')).share())
        .default;
      assert.equal(hostShared, shared);
      assert.equal((await instance.loadRemote('dynamic/Value')).shared, shared);
      assert.equal(globalThis.__modernOwnerMarker, 'persist');
      assert.deepEqual(server.address(), address);
      assert.equal(process.pid, pid);
    }
    assert.equal(disposals, 2);
    assert.equal(application.status.generation, 2);
    failValidation = true;
    await assert.rejects(
      application.update(async () => {}),
      /warmup failed/,
    );
    assert.equal(
      instance[adapters],
      undefined,
      'failed candidate adapters must be released',
    );
    assert.equal((await fetch(url)).status, 503);
    failValidation = false;
    await application.update(async () => {});
    assert.equal(await (await fetch(url)).text(), 'v3');
    assert.equal(instance[adapters].bindings.size, 1);
    assert.equal(
      (await require(path.join(out, 'host.cjs')).share()).default,
      shared,
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve())),
    );
    for (const req of Array.from(instance[adapters]?.bindings || []))
      req.federation.disposeClearCache();
    delete globalThis.__modernOwnerMarker;
    await fs.rm(root, { recursive: true, force: true });
  }
});
