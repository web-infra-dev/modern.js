import { test, beforeAll, afterAll } from '@rstest/core';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import {
  packageRequire,
  packageAudit,
  testRequire,
} from './ssr-update/packages.mjs';
import { buildBridgeFixture } from './ssr-update/bridge-fixture.mjs';
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

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
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

test('Bridge updates drain original producer work and preserve hydrated old releases', async () => {
  const ports = await updatePorts();
  const { createProdServer } = packageRequire('@modern-js/prod-server');
  const { createSSRUpdateAdapter } = packageRequire(
    '@modern-js/plugin-module-federation/ssr-update',
  );

  const { getNodeInstanceLifecycle } = packageRequire(
    '@module-federation/node/lifecycle',
  );
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mf-bridge-update-'));
  console.log('Bridge production fixture', root);
  await fs.writeFile(
    path.join(root, 'packages.json'),
    JSON.stringify(packageAudit(), null, 2),
  );
  let server: any, browser: any, adapter: any, update: any, gate: any;
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
    asset.listen(ports.assets, '127.0.0.1');
    await once(asset, 'listening');
    const assetURL = `http://127.0.0.1:${(asset.address() as AddressInfo).port}`;
    await buildBridgeFixture({ root, assetURL });
    adapter = createSSRUpdateAdapter({
      name: 'bridge_update_host',
      entries: ['index'],
      hydration: {
        remotes: [{ name: 'remote', entry: `${assetURL}/v1/mf-manifest.json` }],
      },
    });
    let application: any, savedHTML: string;
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
      ssrApplication: {
        run: adapter.run,
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
    server.listen(ports.host, '127.0.0.1');
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
    const firstRoot = state.__bridgeUpdateRoots.at(-1);
    const firstContext = state.__bridgeUpdateContexts.at(-1);
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
          document.querySelector<HTMLElement>('#bridge-update-counter')?.dataset
            .hydrated === 'true',
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
    state.__bridgeUpdateGate = {
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
    const hosts = [...adapter.owner.instances];
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
    assert.ok(hosts.every(host => !getNodeInstanceLifecycle(host).closed));
    delete state.__bridgeUpdateGate;
    gate.resolve();
    const result = await update;
    assert.equal(completed, true);
    assert.equal(result.mode, 'application');
    assert.ok(cleared > 0);
    assert.ok(hosts.every(host => getNodeInstanceLifecycle(host).closed));
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
    const nextRoot = state.__bridgeUpdateRoots.at(-1);
    const nextContext = state.__bridgeUpdateContexts.at(-1);
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
    delete state.__bridgeUpdateGate;
    gate?.resolve();
    await update?.catch(() => {});
    await browser?.close();
    server?.closeAllConnections();
    if (server)
      await new Promise<void>(resolve => server.close(() => resolve()));
    asset.closeAllConnections();
    if (asset.listening)
      await new Promise<void>(resolve => asset.close(() => resolve()));
    await adapter?.dispose(undefined, { preserveRemotes: false });
    delete state.__bridgeUpdateRoots;
    delete state.__bridgeUpdateContexts;
  }
}, 600000);
