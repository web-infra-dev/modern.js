process.env.NODE_ENV = 'production';
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const { packageRequire, packageAudit, testRequire } = require('./packages.cjs');
const { createProdServer } = packageRequire('@modern-js/prod-server');
const { createSSRUpdateAdapter } = packageRequire(
  '@modern-js/plugin-module-federation/ssr-update',
);

const deferred = () => {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
};
const waitFor = async predicate => {
  const deadline = Date.now() + 10000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'Bridge state transition timed out');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
};

(async () => {
  const root = await fs.mkdtemp(
    path.join(require('node:os').tmpdir(), 'mf-bridge-update-'),
  );
  console.log('Bridge production fixture', root);
  await fs.writeFile(
    path.join(root, 'packages.json'),
    JSON.stringify(packageAudit(), null, 2),
  );
  let server, browser, adapter, update, gate;
  const asset = http.createServer(async (request, response) => {
    try {
      const file = path.resolve(
        root,
        'releases',
        '.' + new URL(request.url, 'http://x').pathname,
      );
      if (!file.startsWith(path.join(root, 'releases') + path.sep))
        throw Error('Invalid path');
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader(
        'Content-Type',
        file.endsWith('.json') ? 'application/json' : 'application/javascript',
      );
      response.end(await fs.readFile(file));
    } catch {
      response.statusCode = 404;
      response.end('missing');
    }
  });
  try {
    asset.listen(Number(process.env.JO_PORT_ASSETS), '127.0.0.1');
    await once(asset, 'listening');
    const assetURL = `http://127.0.0.1:${asset.address().port}`;
    const build = spawn(
      process.execPath,
      [path.join(__dirname, 'bridge-fixture.cjs')],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          SSR_CACHE_BRIDGE_DIR: root,
          SSR_CACHE_BRIDGE_ASSET_URL: assetURL,
        },
      },
    );
    const [code, signal] = await once(build, 'exit');
    assert.equal(code, 0, `Bridge build failed: ${code ?? signal}`);
    adapter = createSSRUpdateAdapter({
      name: 'bridge_update_host',
      entries: ['index'],
      hydration: {
        remotes: [{ name: 'remote', entry: `${assetURL}/v1/mf-manifest.json` }],
      },
    });
    let application, savedHTML;
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
      ssrApplication: {
        maxPendingRequests: 8,
        requestTimeoutMs: 5000,
        drainTimeoutMs: 5000,
        onReady(value) {
          application = value;
        },
        resolveScope() {
          return ['index'];
        },
        reloadEntry: adapter.reload,
        dispose: (_, entries) => adapter.dispose(entries),
        validate: resources => adapter.prepareResources(resources),
        bypass(request) {
          if (new URL(request.url).searchParams.has('savedRelease'))
            return new Response(savedHTML, {
              headers: {
                'content-type': 'text/html',
                'cache-control': 'no-store',
              },
            });
        },
      },
    });
    server.listen(Number(process.env.JO_PORT_HOST), '127.0.0.1');
    await once(server, 'listening');
    const hostURL = `http://127.0.0.1:${server.address().port}`;
    const address = server.address();
    const pid = process.pid;
    const first = await fetch(hostURL);
    assert.equal(first.status, 200);
    savedHTML = await first.text();
    await fs.writeFile(path.join(root, 'initial.html'), savedHTML);
    assert.match(savedHTML, /Bridge v1/);
    assert.match(savedHTML, /bridge-update-counter/);
    const firstRoot = globalThis.__bridgeUpdateRoots.at(-1);
    const firstContext = globalThis.__bridgeUpdateContexts.at(-1);
    assert.equal(firstRoot.version, 'v1');
    assert.equal(firstContext.version, 'v1');
    assert.equal(firstContext.context.isBrowser, false);

    browser = await testRequire('puppeteer').launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const pages = [];
    async function pageAt(url, version) {
      const page = await browser.newPage();
      const errors = [],
        requests = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('requestfailed', request =>
        errors.push(`${request.url()}: ${request.failure()?.errorText}`),
      );
      page.on('request', request => requests.push(request.url()));
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
      });
      pages.push({ page, errors, requests });
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForFunction(
        () =>
          document.querySelector('#bridge-update-counter')?.dataset.hydrated ===
          'true',
      );
      assert.equal(
        await page.$eval('#bridge-update-counter', node => node.textContent),
        `${version}:0`,
      );
      assert.equal(
        await page.$eval(
          '#bridge-update-counter',
          node => node.dataset.version,
        ),
        version,
      );
      await page.click('#bridge-update-counter');
      await page.waitForFunction(
        value =>
          document.querySelector('#bridge-update-counter')?.textContent ===
          value,
        {},
        `${version}:1`,
      );
      return page;
    }
    const oldPage = await pageAt(hostURL, 'v1');

    // The real producer loader deliberately settles after the HTTP client aborts.
    gate = deferred();
    let producerEntered = false;
    let completed = false;
    globalThis.__bridgeUpdateGate = {
      promise: gate.promise,
      entered() {
        producerEntered = true;
      },
      completed() {
        completed = true;
      },
    };
    const aborter = new AbortController();
    const held = fetch(hostURL, {
      signal: aborter.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36',
        'x-should-stream-all': 'false',
      },
    })
      .then(response => response.text())
      .catch(error => error);
    await waitFor(() => producerEntered);
    const hosts = globalThis.__FEDERATION__.__INSTANCES__.filter(
      instance => instance.name === 'bridge_update_host',
    );
    let cleared = 0;
    for (const host of hosts)
      host.remoteHandler.hooks.lifecycle.removeRemote.on(() => {
        cleared++;
      });
    aborter.abort();
    await held;
    const generation = application.status.generation;
    update = adapter.update(application, 'remote', {
      entry: `${assetURL}/v2/mf-manifest.json`,
      client: { entry: `${assetURL}/v2/mf-manifest.json` },
    });
    void update.catch(() => {});
    await waitFor(() => application.status.phase === 'draining');
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(completed, false);
    assert.equal(application.status.phase, 'draining');
    assert.ok(application.status.activeRequests > 0);
    assert.equal(
      cleared,
      0,
      'cache invalidation ran before original Bridge producer work settled',
    );
    assert.equal(adapter.status(application).mutationStarted, false);
    assert.ok(hosts.every(host => !host.disposed));
    delete globalThis.__bridgeUpdateGate;
    gate.resolve();
    const result = await update;
    assert.equal(completed, true);
    assert.equal(result.mode, 'application');
    assert.ok(cleared > 0);
    assert.ok(hosts.every(host => host.disposed));
    assert.ok(application.status.generation > generation);
    assert.equal(application.status.activeRequests, 0);
    assert.equal(application.status.phase, 'serving');

    const current = await fetch(hostURL);
    const currentHTML = await current.text();
    await fs.writeFile(path.join(root, 'updated.html'), currentHTML);
    assert.equal(current.status, 200);
    assert.match(currentHTML, /Bridge v2/);
    const release = JSON.parse(
      currentHTML.match(/data-modern-mf-release>(.*?)<\/script>/)[1],
    );
    assert.match(release.remotes[0].entry, /\/v2\//);
    const nextRoot = globalThis.__bridgeUpdateRoots.at(-1);
    const nextContext = globalThis.__bridgeUpdateContexts.at(-1);
    assert.equal(nextRoot.version, 'v2');
    assert.notEqual(nextRoot.root, firstRoot.root);
    assert.equal(nextContext.version, 'v2');
    assert.equal(nextContext.context.isBrowser, false);
    assert.notEqual(nextContext.context, firstContext.context);
    assert.equal(
      await oldPage.$eval('#bridge-update-counter', node => node.textContent),
      'v1:1',
    );
    await oldPage.click('#bridge-update-counter');
    await oldPage.waitForFunction(
      () =>
        document.querySelector('#bridge-update-counter')?.textContent ===
        'v1:2',
    );
    await pageAt(hostURL, 'v2');
    await pageAt(`${hostURL}/?savedRelease=1`, 'v1');
    for (const { errors } of pages) assert.deepEqual(errors, []);
    const oldRequests = pages
      .at(-1)
      .requests.filter(url => url.startsWith(assetURL));
    assert.ok(oldRequests.some(url => url.includes('/v1/')));
    assert.ok(oldRequests.every(url => !url.includes('/v2/')));
    assert.equal(process.pid, pid);
    assert.deepEqual(server.address(), address);
    await fs.writeFile(
      path.join(root, 'result.json'),
      JSON.stringify(
        {
          passed: true,
          packages: packageAudit(),
          update: result,
          cleared,
          producerCompleted: completed,
          oldHTMLProviderRequests: oldRequests,
          rootRecreated: nextRoot.root !== firstRoot.root,
          contextRecreated: nextContext.context !== firstContext.context,
        },
        null,
        2,
      ),
    );
    console.log(
      'Bridge SSR update acceptance passed:',
      path.join(root, 'result.json'),
    );
  } finally {
    delete globalThis.__bridgeUpdateGate;
    gate?.resolve();
    await update?.catch(() => {});
    await browser?.close();
    server?.closeAllConnections();
    if (server) await new Promise(resolve => server.close(resolve));
    asset.closeAllConnections();
    if (asset.listening) await new Promise(resolve => asset.close(resolve));
    await adapter?.dispose(undefined, { preserveRemotes: false });
    delete globalThis.__bridgeUpdateRoots;
    delete globalThis.__bridgeUpdateContexts;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
