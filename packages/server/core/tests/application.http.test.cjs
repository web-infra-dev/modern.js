const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, writeFile, rm, mkdir } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { cleanRequireCache } = require('@modern-js/utils');
const {
  createServerBase,
  createDefaultPlugins,
  renderPlugin,
} = require('../dist/cjs');
const {
  injectResourcePlugin,
  createNodeServer,
  getServerManifest,
} = require('../dist/cjs/adapters/node');
const getDefaultConfig = () => ({
  html: {},
  output: {},
  source: {},
  tools: {},
  server: {},
  bff: {},
  dev: {},
  security: {},
});
const getDefaultAppContext = () => ({ apiDirectory: '', lambdaDirectory: '' });

test('rebuilds real Modern SSR and loader entries, skips old HTML cache, and keeps the HTTP server', async () => {
  const pwd = await mkdtemp(path.join(tmpdir(), 'modern-owner-'));
  const entry = path.join(pwd, 'entry.cjs');
  const loader = path.join(pwd, 'bundles/main-server-loaders.js');
  const write = async version => {
    await writeFile(
      entry,
      `exports.requestHandler = async (req, options) => new Response(${JSON.stringify(version)} + ':' + Boolean(options.work));`,
    );
    await writeFile(
      loader,
      `exports.handleRequest = async ({context}) => new Response(${JSON.stringify(version)} + ':loader:' + Boolean(context.work)); exports.routes = [];`,
    );
  };
  await mkdir(path.dirname(loader));
  await writeFile(path.join(pwd, 'index.html'), '<html>template</html>');
  await write('v1');
  const config = getDefaultConfig();
  config.server = { ssr: true };
  let application;
  let preCalls = 0;
  const server = createServerBase({
    pwd,
    config,
    appContext: getDefaultAppContext(),
    routes: [
      {
        urlPath: '/',
        entryName: 'main',
        entryPath: 'index.html',
        bundle: 'entry.cjs',
        isSSR: true,
      },
    ],
  });
  server.use('*', async (_, next) => {
    preCalls++;
    await next();
  });
  server.addPlugins([
    ...createDefaultPlugins({
      cacheConfig: {
        strategy: { maxAge: 100000, staleWhileRevalidate: 100000 },
      },
    }),
    {
      name: 'pre-business',
      setup(api) {
        api.onPrepare(() => {
          api.getServerContext().middlewares.push({
            name: 'pre-business',
            order: 'pre',
            handler: async (_, next) => {
              preCalls++;
              await next();
            },
          });
        });
      },
    },
    injectResourcePlugin({
      maxPendingRequests: 3,
      requestTimeoutMs: 1000,
      drainTimeoutMs: 1000,
      onReady(value) {
        application = value;
      },
      bypass: async request =>
        new URL(request.url).pathname === '/live'
          ? new Response('alive')
          : undefined,
    }),
    renderPlugin(),
  ]);
  let nodeServer;
  try {
    await server.init();
    nodeServer = await createNodeServer(server.handle);
    nodeServer.listen(0, '127.0.0.1');
    await once(nodeServer, 'listening');
    const address = nodeServer.address();
    const base = `http://127.0.0.1:${address.port}`;
    const pid = process.pid;
    assert.equal(await (await fetch(base)).text(), 'v1:true');
    assert.equal((await fetch(base)).headers.get('x-render-cache'), 'hit');
    assert.equal(
      await (await fetch(`${base}/?__loader=main`)).text(),
      'v1:loader:true',
    );
    let release;
    const wait = new Promise(resolve => {
      release = resolve;
    });
    let entered;
    const entryReady = new Promise(resolve => {
      entered = resolve;
    });
    const update = application.update(async () => {
      entered();
      await wait;
      await write('v2');
      // Exact owned CommonJS roots only. MF adapter invalidation is a separate layer.
      // Modern evicts declared application roots after invalidation and disposal.
    });
    await entryReady;
    const before = preCalls;
    const queued = fetch(base);
    assert.equal(await (await fetch(`${base}/live`)).text(), 'alive');
    assert.equal(preCalls, before);
    release();
    assert.equal(await update, 1);
    const fresh = await queued;
    assert.equal(await fresh.text(), 'v2:true');
    assert.equal(fresh.headers.get('x-render-cache'), 'miss');
    assert.equal(
      await (await fetch(`${base}/?__loader=main`)).text(),
      'v2:loader:true',
    );
    assert.deepEqual(nodeServer.address(), address);
    assert.equal(process.pid, pid);
    await assert.rejects(
      application.update(async () => {
        await writeFile(entry, 'exports.requestHandler = 42;');
        cleanRequireCache([require.resolve(entry)]);
      }),
      error =>
        error instanceof AggregateError &&
        error.errors.some(
          nested =>
            nested instanceof AggregateError &&
            nested.errors.some(reason =>
              /Invalid SSR entry/.test(reason.message),
            ),
        ),
    );
    assert.equal((await fetch(base)).status, 503);
    await application.update(async () => {
      await write('v3');
      // Modern evicts declared application roots after invalidation and disposal.
    });
    assert.equal(await (await fetch(base)).text(), 'v3:true');
  } finally {
    nodeServer?.closeAllConnections();
    if (nodeServer?.listening)
      await new Promise((resolve, reject) =>
        nodeServer.close(error => (error ? reject(error) : resolve())),
      );
    cleanRequireCache([require.resolve(entry)]);
    cleanRequireCache([require.resolve(loader)]);
    await rm(pwd, { recursive: true, force: true });
  }
});

test('rejects native ESM application entries before serving or mutation', async () => {
  const pwd = await mkdtemp(path.join(tmpdir(), 'modern-owner-esm-'));
  await writeFile(path.join(pwd, 'index.html'), '<html/>');
  await writeFile(
    path.join(pwd, 'entry.mjs'),
    'export const requestHandler = () => new Response("esm");',
  );
  let ready = false;
  const server = createServerBase({
    pwd,
    config: getDefaultConfig(),
    appContext: getDefaultAppContext(),
    routes: [
      {
        urlPath: '/',
        entryName: 'main',
        entryPath: 'index.html',
        bundle: 'entry.mjs',
        isSSR: true,
      },
    ],
  });
  server.addPlugins([
    ...createDefaultPlugins(),
    injectResourcePlugin({
      maxPendingRequests: 1,
      requestTimeoutMs: 1000,
      drainTimeoutMs: 1000,
      onReady() {
        ready = true;
      },
    }),
    renderPlugin(),
  ]);
  try {
    await assert.rejects(
      server.init(),
      error =>
        error instanceof AggregateError &&
        error.errors.some(
          nested =>
            nested instanceof AggregateError &&
            nested.errors.some(reason => /Native ESM/.test(reason.message)),
        ),
    );
    assert.equal(ready, false);
  } finally {
    await rm(pwd, { recursive: true, force: true });
  }
});

test('a failed entry waits for other asynchronous entry initialization before rejecting', async () => {
  const pwd = await mkdtemp(path.join(tmpdir(), 'modern-owner-drain-'));
  const pendingPath = path.join(pwd, 'pending.cjs');
  const failedPath = path.join(pwd, 'failed.cjs');
  await writeFile(
    pendingPath,
    'exports.requestHandler = new Promise(resolve => { exports.ready = () => resolve(() => new Response("ready")); });',
  );
  await writeFile(failedPath, 'exports.requestHandler = 42;');
  let settled = false;
  const loading = getServerManifest(
    pwd,
    [
      { entryName: 'failed', bundle: 'failed.cjs', isSSR: true },
      { entryName: 'pending', bundle: 'pending.cjs', isSSR: true },
    ],
    undefined,
    { reloadable: true },
  );
  const outcome = loading.then(
    () => {
      settled = true;
    },
    error => {
      settled = true;
      return error;
    },
  );
  try {
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(settled, false);
    require(pendingPath).ready();
    assert.ok((await outcome) instanceof AggregateError);
  } finally {
    cleanRequireCache([
      require.resolve(pendingPath),
      require.resolve(failedPath),
    ]);
    await rm(pwd, { recursive: true, force: true });
  }
});
