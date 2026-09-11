const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { tmpdir } = require('node:os');
const { once } = require('node:events');
const {
  createServerBase,
  createDefaultPlugins,
  renderPlugin,
} = require('../dist/cjs');
const {
  injectResourcePlugin,
  createNodeServer,
} = require('../dist/cjs/adapters/node');

const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve;
  const promise = new Promise(r => {
    resolve = r;
  });
  return { promise, resolve };
};

test('compiled static imports reload their Modern entries while independent requests and modules survive', async () => {
  const mf = process.env.SSR_CACHE_MF_ROOT;
  assert.ok(mf, 'Set SSR_CACHE_MF_ROOT to the companion MF worktree');
  const { rspack, container } = require(
    process.env.SSR_CACHE_RSPACK_ENTRY ||
      require.resolve('@rspack/core', { paths: [mf] }),
  );
  const { SSRDependencyPlugin } = require(
    path.join(mf, 'packages/modernjs-v3/dist/cjs/cli/SSRDependencyPlugin'),
  );
  const { createSSRUpdateAdapter } = require(
    path.join(mf, 'packages/modernjs-v3/dist/cjs/server/ssrUpdate'),
  );
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(tmpdir(), 'modern-static-mf-')),
  );
  const out = path.join(root, 'dist');
  const write = (file, source) => fs.writeFile(path.join(root, file), source);
  globalThis.__staticRuns = { stable: 0, a: 0, b: 0, c: 0 };
  await write(
    'stable.js',
    'globalThis.__staticRuns.stable++; export default {};',
  );
  await write(
    'parent.js',
    "import value from 'remote/Value'; export default value;",
  );
  for (const entry of ['a', 'b', 'c']) {
    await write(
      `${entry}.js`,
      `import stable from './stable'; globalThis.__staticRuns.${entry}++; export { stable }; export const req = __webpack_require__; export const requestHandler = import('./page-${entry}').then(m => m.default);`,
    );
    await write(
      `page-${entry}.js`,
      `${entry === 'b' ? "const value = 'unrelated';" : "import value from './parent';"} export default async function(req, options) { if (globalThis.__staticProducer && new URL(req.url).searchParams.has('hold')) options.work.track(globalThis.__staticProducer); return new Response(value); }`,
    );
  }
  await write(
    'a-server-loaders.js',
    "export const loadModules = () => import('./loader-a');",
  );
  await write(
    'loader-a.js',
    "import value from './parent'; export const routes = []; export const handleRequest = async () => new Response(value + ':loader');",
  );
  await write(
    'plugin.js',
    "module.exports=()=>({name:'local-entry',loadEntry({remoteInfo}) { return __non_webpack_require__(remoteInfo.entry); }});",
  );
  await write('v1.js', "export default 'v1';");
  await write('v2.js', "export default 'v2';");
  const common = {
    context: root,
    target: 'node',
    mode: 'production',
    devtool: false,
    optimization: {
      minimize:
        process.env.SSR_STATIC_OPTIMIZE === '1' ||
        process.env.SSR_STATIC_NUMERIC === '1',
      concatenateModules: process.env.SSR_STATIC_OPTIMIZE === '1',
      moduleIds:
        process.env.SSR_STATIC_OPTIMIZE === '1' ||
        process.env.SSR_STATIC_NUMERIC === '1'
          ? 'deterministic'
          : 'named',
    },
    output: {
      path: out,
      filename: data =>
        data.chunk.name.endsWith('-server-loaders')
          ? 'bundles/[name].js'
          : '[name].cjs',
      chunkFilename: '[name].cjs',
      library: { type: 'commonjs2' },
    },
  };
  const configs = ['v1', 'v2'].map(v => ({
    ...common,
    entry: {},
    output: { ...common.output, uniqueName: v },
    plugins: [
      new container.ModuleFederationPlugin({
        name: v,
        implementation: path.join(mf, 'packages/runtime-tools'),
        filename: `${v}.cjs`,
        library: { type: 'commonjs-module' },
        exposes: { './Value': `./${v}.js` },
      }),
    ],
  }));
  configs.push({
    ...common,
    entry: {
      a: './a.js',
      b: './b.js',
      c: './c.js',
      'a-server-loaders': './a-server-loaders.js',
    },
    output: { ...common.output, uniqueName: 'static-host' },
    plugins: [
      new container.ModuleFederationPlugin({
        name: 'static-host',
        implementation: path.join(mf, 'packages/runtime-tools'),
        remotes: { remote: { external: `v1@${path.join(out, 'v1.cjs')}` } },
        runtimePlugins: [
          path.join(root, 'plugin.js'),
          path.join(
            mf,
            'packages/modernjs-v3/dist/cjs/cli/mfRuntimePlugins/ssr-ownership.js',
          ),
        ],
      }),
      new SSRDependencyPlugin({ name: 'static-host', remotes: ['remote'] }),
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
    await new Promise(resolve => compiler.close(resolve));
  }
  await fs.writeFile(path.join(out, 'index.html'), '<html>template</html>');
  const adapter = createSSRUpdateAdapter({
    name: 'static-host',
    entries: ['a', 'b', 'c'],
    staticOnly: true,
  });
  let application;
  let fail = false;
  const server = createServerBase({
    pwd: out,
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
    appContext: { apiDirectory: '', lambdaDirectory: '' },
    routes: ['a', 'b', 'c'].map(entry => ({
      urlPath: `/${entry}`,
      entryName: entry,
      entryPath: 'index.html',
      bundle: `${entry}.cjs`,
      isSSR: true,
    })),
  });
  server.use('*', async (context, next) => {
    if (new URL(context.req.url).pathname === '/b/rewrite')
      context.set('matchPathname', '/a');
    await next();
  });
  server.addPlugins([
    ...createDefaultPlugins({
      cacheConfig: {
        strategy: { maxAge: 100000, staleWhileRevalidate: 100000 },
      },
    }),
    injectResourcePlugin({
      maxPendingRequests: 4,
      requestTimeoutMs: 3000,
      drainTimeoutMs: 3000,
      onReady(value) {
        application = value;
      },
      resolveScope(request) {
        const entry = new URL(request.url).pathname.split('/')[1];
        return ['a', 'b', 'c'].includes(entry) ? [entry] : undefined;
      },
      reloadEntry: adapter.reload,
      async dispose(_, entries) {
        adapter.dispose(entries);
      },
      async validate() {
        if (fail) throw new Error('candidate failed');
      },
    }),
    renderPlugin(),
  ]);
  await server.init();
  const http = await createNodeServer(server.handle);
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const address = http.address();
  const url = `http://127.0.0.1:${address.port}`;
  let pendingUpdate = Promise.resolve();
  let releaseHeld;
  const get = async pathname => (await fetch(url + pathname)).text();
  try {
    assert.equal(await get('/a'), 'v1');
    assert.equal(await get('/c'), 'v1');
    assert.equal(await get('/b'), 'unrelated');
    assert.equal(await get('/a?__loader=a'), 'v1:loader');
    assert.equal(
      (await fetch(`${url}/b`)).headers.get('x-render-cache'),
      'hit',
    );
    const before = { ...globalThis.__staticRuns };
    const stable = require(path.join(out, 'a.cjs')).stable;
    const unrelatedStable = require(path.join(out, 'b.cjs')).stable;
    assert.deepEqual(adapter.plan('remote'), {
      mode: 'entries',
      entries: ['a', 'c'],
      reasons: [],
    });
    const producer = deferred();
    releaseHeld = producer.resolve;
    globalThis.__staticProducer = producer.promise;
    assert.equal(await get('/a/hold?hold'), 'v1');
    const instance = require(path.join(out, 'a.cjs')).req.federation.instance;
    const update = (pendingUpdate = adapter.update(application, 'remote', {
      entry: path.join(out, 'v2.cjs'),
      entryGlobalName: 'v2',
    }));
    await tick();
    assert.equal(application.status.phase, 'draining');
    assert.equal(await get('/b'), 'unrelated');
    assert.equal((await fetch(`${url}/b/rewrite`)).status, 503);
    const waiting = get('/c');
    producer.resolve();
    assert.deepEqual(await update, {
      mode: 'entries',
      entries: ['a', 'c'],
      reasons: [],
      generation: 1,
    });
    assert.equal(await waiting, 'v2');
    assert.equal(await get('/a'), 'v2');
    assert.equal(await get('/a?__loader=a'), 'v2:loader');
    assert.equal(
      (await fetch(`${url}/b`)).headers.get('x-render-cache'),
      'hit',
    );
    assert.equal(globalThis.__staticRuns.b, before.b);
    assert.equal(require(path.join(out, 'b.cjs')).stable, unrelatedStable);
    const updatedStable = await adapter
      .reload('a')
      .then(exports => exports.stable);
    if (process.env.SSR_STATIC_OPTIMIZE === '1') {
      // Scope hoisting places stable inside each entry's execution unit. The two
      // affected units execute again; the independent b unit remains untouched.
      assert.equal(globalThis.__staticRuns.stable, before.stable + 2);
      assert.notEqual(updatedStable, stable);
    } else {
      assert.equal(globalThis.__staticRuns.stable, before.stable);
      assert.equal(updatedStable, stable);
    }
    assert.deepEqual(http.address(), address);
    assert.equal(
      createSSRUpdateAdapter({
        name: 'static-host',
        entries: ['a', 'b', 'c'],
      }).plan('remote').mode,
      'application',
    );
    assert.equal(adapter.plan('dynamic').mode, 'application');
    fail = true;
    await assert.rejects(
      application.update(async () => {}, ['a']),
      /candidate failed/,
    );
    assert.equal((await fetch(`${url}/a`)).status, 503);
    assert.equal(await get('/b'), 'unrelated');
    fail = false;
    await application.update(
      async entries => {
        assert.equal(entries, undefined);
      },
      ['a'],
    );
    assert.equal(await get('/a'), 'v2');
    const beforeFallback = globalThis.__staticRuns.b;
    const records = [
      ...globalThis[Symbol.for('modern-js.mf.ssr.entries')].values(),
    ];
    delete records.find(record => record.entry === 'a').runtime
      .remotesLoadingData.consumerModuleIdToParentModuleIds;
    const incomplete = await adapter.update(application, 'remote', {
      entry: path.join(out, 'v1.cjs'),
      entryGlobalName: 'v1',
    });
    assert.equal(incomplete.mode, 'application');
    assert.ok(incomplete.reasons.includes('missing-native-invalidation-graph'));
    assert.equal(await get('/a'), 'v1');
    assert.ok(globalThis.__staticRuns.b > beforeFallback);
    instance.registerRemotes([
      {
        name: 'dynamic',
        entry: path.join(out, 'v1.cjs'),
        type: 'commonjs-module',
        entryGlobalName: 'v1',
      },
    ]);
    const beforeDynamic = globalThis.__staticRuns.b;
    const dynamic = await adapter.update(application, 'dynamic', {
      entry: path.join(out, 'v2.cjs'),
      entryGlobalName: 'v2',
    });
    assert.equal(dynamic.mode, 'application');
    assert.ok(dynamic.reasons.includes('runtime-consumption-observed'));
    assert.equal((await instance.loadRemote('dynamic/Value')).default, 'v2');
    assert.ok(globalThis.__staticRuns.b > beforeDynamic);
  } finally {
    releaseHeld?.();
    await pendingUpdate.catch(() => {});
    globalThis.__staticProducer = undefined;
    http.closeAllConnections();
    await new Promise(resolve => http.close(resolve));
    adapter.dispose();
    await fs.rm(root, { recursive: true, force: true });
    delete globalThis.__staticRuns;
  }
});
