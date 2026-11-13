const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { fork, spawn } = require('node:child_process');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const { createFixture } = require('./dev-fixture.cjs');
const { packageRequire, packageAudit, testRequire } = require('./packages.cjs');
const { createDevBuildConnection } = packageRequire(
  '@module-federation/enhanced/rspack',
);

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function port(name) {
  const value = Number(process.env[`JO_PORT_${name}`]);
  assert.ok(value > 0 && value < 65536, `Allocate JO_PORT_${name}`);
  return value;
}
async function defaultBrowser(root) {
  const browser = await testRequire('puppeteer').launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    userDataDir: path.join(root, 'browser-profile'),
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  return {
    open: url => page.goto(url, { waitUntil: 'load' }),
    evaluate: fn => page.evaluate(fn),
    click: selector => page.click(selector),
    close: () => browser.close(),
  };
}

async function run(mode = 'ordinary') {
  const nested = mode === 'nested';
  const staticProvider = mode === 'build-serve';
  const appMode = nested || staticProvider ? 'ordinary' : mode;
  const csr = appMode === 'service-csr';
  const ports = {
    host: port('HOST'),
    provider: port('PROVIDER'),
    manifest: port('PROVIDER'),
    broker: port('BROKER'),
    ...(nested ? { middle: port('MIDDLE') } : {}),
  };
  const brokerUrl = `ws://127.0.0.1:${ports.broker}`;
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), `mf-subscription-${mode}-`),
  );
  const fixture = await createFixture(root, appMode, ports);
  const hostName = `dev_update_${appMode.replaceAll('-', '_')}_host`;
  const children = [];
  const evidence = {
    mode,
    root,
    ports,
    packages: packageAudit(),
    publications: [],
    edits: [],
  };
  let browser;
  let observer;
  let broker;
  let staticServer;
  let closing;
  let failure;
  console.log(`Subscription ${mode} fixture: ${root}`);

  async function startBroker() {
    const enhancedRequire = createRequire(
      packageRequire.resolve('@module-federation/enhanced/rspack'),
    );
    const entry = enhancedRequire.resolve(
      '@module-federation/dts-plugin/dist/start-broker.js',
    );
    broker = fork(entry, [], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    evidence.broker = { entry, pid: broker.pid, output: '' };
    for (const stream of [broker.stdout, broker.stderr])
      stream.on('data', chunk => {
        evidence.broker.output += chunk;
        if (process.env.MF_LAB_VERBOSE)
          process.stdout.write(`[broker] ${chunk}`);
      });
    broker.on('error', error => {
      failure = error;
    });
    broker.on('exit', (code, signal) => {
      if (!closing)
        failure = new Error(
          `Broker exited ${code ?? signal}\n${evidence.broker.output}`,
        );
    });
    const ready = new AbortController();
    const timeout = setTimeout(
      () => ready.abort(new Error('Broker startup timed out')),
      10000,
    );
    try {
      const message = once(broker, 'message', { signal: ready.signal });
      const exited = once(broker, 'exit', { signal: ready.signal }).then(() => {
        throw failure || new Error('Broker exited before ready');
      });
      broker.send({ kind: 'start', port: ports.broker });
      assert.equal((await Promise.race([message, exited]))[0], 'ready');
    } finally {
      clearTimeout(timeout);
      ready.abort();
    }
  }

  function launch(app, command = 'dev') {
    const child = spawn(
      process.execPath,
      [path.join(fixture.appTools, 'bin/modern.js'), command],
      {
        cwd: path.join(root, app),
        env: {
          ...process.env,
          NODE_ENV: command === 'dev' ? 'development' : 'production',
          // Production builds need an explicit release identity between edits.
          ...(command === 'build'
            ? { MF_BUILD_VERSION: `fixture-${children.length}` }
            : {}),
          MODERN_MF_AUTO_CORS: '1',
          NO_COLOR: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const record = { app, command, child, log: '' };
    children.push(record);
    for (const stream of [child.stdout, child.stderr])
      stream.on('data', chunk => {
        record.log += chunk;
        if (process.env.MF_LAB_VERBOSE)
          process.stdout.write(`[${app}:${command}] ${chunk}`);
      });
    child.on('error', error => {
      failure = error;
    });
    child.on('exit', code => {
      if (!closing && (command !== 'build' || code !== 0))
        failure = new Error(`${app} ${command} exited ${code}\n${record.log}`);
    });
    return record;
  }
  async function eventually(label, predicate) {
    const deadline = Date.now() + 90000;
    let last;
    while (Date.now() < deadline) {
      if (failure) throw failure;
      try {
        const value = await predicate();
        if (value) return value;
      } catch (error) {
        last = error;
      }
      await pause(100);
    }
    throw new Error(`${label}: timed out${last ? `\n${last.stack}` : ''}`);
  }
  const manifest = async url => {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return;
    return response.json();
  };
  const version = value => value?.metaData?.buildInfo?.buildVersion;
  async function buildProvider() {
    const record = launch('provider', 'build');
    const [code] = await once(record.child, 'exit');
    assert.equal(code, 0, record.log);
  }
  const readBrowser = () =>
    browser.evaluate(() => {
      const remote = document.querySelector('[data-testid="dev-remote"]');
      return {
        ui: remote?.getAttribute('data-ui'),
        loader: remote?.getAttribute('data-loader'),
        heading: remote?.querySelector('h2')?.textContent,
        count: document.querySelector('#dev-counter')?.textContent,
        hydrated: document.querySelector('#dev-counter')?.dataset.hydrated,
        timeOrigin: performance.timeOrigin,
        url: location.href,
      };
    });
  async function expectHTTP(ui, loader, heading) {
    const response = await fetch(fixture.hostURL, {
      signal: AbortSignal.timeout(10000),
    });
    const html = await response.text();
    await fs.writeFile(path.join(root, 'last-ssr.html'), html);
    assert.equal(response.status, 200, html.slice(-4000));
    const frames = [
      ...html.matchAll(
        /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
      ),
    ].map(match => JSON.parse(match[1])[1]);
    if (csr) {
      assert.equal(frames.length, 0);
      assert.ok(!html.includes('data-testid="dev-remote"'));
      return;
    }
    const content =
      appMode === 'ordinary'
        ? html
        : frames
            .filter(frame => frame.type === 'html')
            .map(frame => frame.html)
            .join('');
    assert.ok(content.includes(`data-ui="${ui}"`), content.slice(-4000));
    assert.ok(
      content.includes(`data-loader="${loader}"`),
      content.slice(-4000),
    );
    if (heading) assert.ok(content.includes(heading), content.slice(-4000));
  }
  async function stop() {
    if (closing) return closing;
    closing = (async () => {
      try {
        await browser?.close();
        await observer?.close();
        if (staticServer?.listening) {
          staticServer.closeAllConnections();
          await new Promise(resolve => staticServer.close(resolve));
        }
        await Promise.all(
          children.map(async ({ child }) => {
            if (child.exitCode !== null || child.signalCode) return;
            const exit = once(child, 'exit');
            child.kill('SIGTERM');
            await exit;
          }),
        );
      } finally {
        if (broker && broker.exitCode === null && !broker.signalCode) {
          const exit = once(broker, 'exit');
          broker.kill('SIGTERM');
          await exit;
        }
      }
      for (const [index, record] of children.entries())
        await fs.writeFile(
          path.join(root, `${index}-${record.app}-${record.command}.log`),
          record.log,
        );
      await fs.writeFile(
        path.join(root, 'result.json'),
        JSON.stringify(evidence, null, 2),
      );
    })();
    return closing;
  }
  const interrupt = () => void stop().then(() => process.exit(130));
  process.once('SIGTERM', interrupt);
  process.once('SIGINT', interrupt);
  try {
    await startBroker();
    observer = createDevBuildConnection(
      {
        autoStartBroker: false,
        remotes: [
          {
            name: hostName,
            entry: `${fixture.hostURL}/static/mf-manifest.json`,
            brokerUrl,
          },
        ],
      },
      {
        onUpdate(update) {
          evidence.publications.push({ ...update, time: Date.now() });
        },
        onError(error) {
          evidence.observerError = String(error);
        },
        onDiagnostics(diagnostics) {
          evidence.diagnostics = diagnostics;
        },
      },
    );
    if (staticProvider) {
      await buildProvider();
      const output = path.join(root, 'provider/dist');
      staticServer = http.createServer(async (request, response) => {
        response.setHeader('Access-Control-Allow-Origin', fixture.hostURL);
        response.setHeader('Cache-Control', 'no-store');
        try {
          const pathname = new URL(request.url, fixture.providerURL).pathname;
          const file = path.resolve(output, `.${pathname}`);
          assert.ok(file.startsWith(output + path.sep));
          response.setHeader(
            'Content-Type',
            file.endsWith('.json')
              ? 'application/json'
              : file.endsWith('.css')
                ? 'text/css'
                : 'application/javascript',
          );
          response.end(await fs.readFile(file));
        } catch {
          response.writeHead(404).end();
        }
      });
      staticServer.listen(ports.provider);
      await once(staticServer, 'listening');
      assert.equal(staticServer.address().port, ports.provider);
      await eventually('static producer manifest', () =>
        manifest(fixture.providerManifestURL),
      );
    }
    const host = launch('host');
    if (!staticProvider && appMode === 'ordinary') {
      await eventually('host fails before its producer starts', () =>
        host.log.includes('SSR resource preparation failed'),
      );
      evidence.coldStartFailure = true;
    }
    if (!staticProvider) launch('provider');
    if (nested) launch('middle');
    const initial = await eventually('producer publication', () =>
      manifest(fixture.providerManifestURL),
    );
    if (staticProvider)
      await eventually('initial host HTTP', async () => {
        await expectHTTP('v1', 'v1');
        return true;
      });
    else
      await eventually('initial host applied publication', () =>
        evidence.publications.some(update =>
          update.publication.sources?.some(
            source =>
              source.name === fixture.providerName &&
              source.buildVersion === version(initial),
          ),
        ),
      );
    // The first request after the notification must already use the ready graph.
    await expectHTTP('v1', 'v1');
    await eventually('broker diagnostic discovery', () => evidence.diagnostics);
    const diagnosticURL = evidence.diagnostics.url;
    assert.equal(new URL(diagnosticURL).port, String(port('BROKER')));
    const readDiagnostics = async () => {
      const url = new URL(diagnosticURL);
      url.searchParams.set('consumer', hostName);
      url.searchParams.set('source', 'DevBuild');
      const response = await fetch(url);
      assert.equal(response.status, 200);
      return response.json();
    };
    const hostBuild = version(
      await manifest(`${fixture.hostURL}/static/mf-manifest.json`),
    );
    const middleBuild = nested
      ? version(
          await manifest(
            `http://localhost:${ports.middle}/static/mf-manifest.json`,
          ),
        )
      : undefined;
    if (!process.env.MF_DEV_NO_BROWSER) {
      browser = process.env.MF_DEV_BROWSER_DRIVER
        ? await require(path.resolve(process.env.MF_DEV_BROWSER_DRIVER))(root)
        : await defaultBrowser(root);
      await browser.open(fixture.hostURL);
      await eventually(
        'interactive initial browser',
        async () => (await readBrowser()).hydrated === 'true',
      );
      await browser.click('#dev-counter');
      await eventually(
        'counter increment',
        async () => (await readBrowser()).count === 'count:1',
      );
      evidence.initialBrowser = await readBrowser();
    }
    const route = path.join(root, 'provider/src/routes/remote');
    async function edit(label, file, source, ui, loader, heading) {
      const previous = version(await manifest(fixture.providerManifestURL));
      const before = evidence.publications.length;
      const beforeBrowser = browser ? await readBrowser() : undefined;
      await fs.writeFile(path.join(route, file), source);
      if (staticProvider) await buildProvider();
      const next = await eventually(`${label}: producer built`, async () => {
        const next = await manifest(fixture.providerManifestURL);
        return next && version(next) !== previous && next;
      });
      if (staticProvider) {
        // No producer subscription exists. This request itself must discover v2.
        await expectHTTP(ui, loader, heading);
      } else {
        await eventually(`${label}: host applied without a request`, () =>
          evidence.publications
            .slice(before)
            .some(update =>
              update.publication.sources?.some(
                source =>
                  source.name === fixture.providerName &&
                  source.buildVersion === version(next),
              ),
            ),
        );
        await expectHTTP(ui, loader, heading);
      }
      assert.equal(
        version(await manifest(`${fixture.hostURL}/static/mf-manifest.json`)),
        hostBuild,
      );
      if (nested)
        assert.equal(
          version(
            await manifest(
              `http://localhost:${ports.middle}/static/mf-manifest.json`,
            ),
          ),
          middleBuild,
        );
      if (!nested) {
        const result = await eventually(
          `${label}: actual update diagnostics`,
          async () => {
            const snapshot = await readDiagnostics();
            return snapshot.entries.find(
              entry =>
                entry.context?.outcome === 'applied' &&
                entry.context?.remote === fixture.providerName &&
                entry.context?.buildVersion === version(next),
            );
          },
        );
        evidence.updateResults ||= [];
        evidence.updateResults.push(result);
        assert.ok(host.log.includes(`[MF] ${fixture.providerName} updated`));
      }
      let current;
      if (browser) {
        current = await eventually(`${label}: browser updated`, async () => {
          const current = await readBrowser();
          return (
            current.ui === ui &&
            current.loader === loader &&
            current.hydrated === 'true' &&
            (!(staticProvider || appMode.startsWith('service')) ||
              current.timeOrigin !== beforeBrowser.timeOrigin) &&
            (!heading || current.heading.includes(heading)) &&
            current
          );
        });
        if (!staticProvider && !appMode.startsWith('service')) {
          assert.equal(
            current.timeOrigin,
            evidence.initialBrowser.timeOrigin,
            'Unexpected document reload',
          );
          assert.equal(current.count, 'count:1', 'React state was lost');
        } else {
          assert.notEqual(
            current.timeOrigin,
            beforeBrowser.timeOrigin,
            'Static artifacts and Service descriptors require reload',
          );
          assert.equal(current.count, 'count:0');
        }
      }
      evidence.edits.push({
        label,
        buildVersion: version(next),
        browser: current,
      });
      console.log(`PASS ${mode}: ${label}`);
    }
    await edit(
      'component dependency',
      'version.ts',
      'export const version = "v2";\n',
      'v2',
      'v1',
    );
    await edit(
      'loader only',
      'page.data.ts',
      'export const loader = async () => ({version: "v2"});\n',
      'v2',
      'v2',
    );
    const component = await fs.readFile(path.join(route, 'page.tsx'), 'utf8');
    await edit(
      'component function',
      'page.tsx',
      component.replace('Remote UI {version}', 'Refreshed UI {version}'),
      'v2',
      'v2',
      'Refreshed UI',
    );
    if (browser && appMode !== 'ordinary') {
      const beforeRemount = await readBrowser();
      await browser.click('#dev-toggle');
      await eventually(
        'remote unmounted',
        async () => !(await readBrowser()).ui,
      );
      await browser.click('#dev-toggle');
      evidence.remount = await eventually(
        'updated remote mounts again',
        async () => {
          const current = await readBrowser();
          return (
            current.ui === 'v2' &&
            current.loader === 'v2' &&
            current.hydrated === 'true' &&
            current
          );
        },
      );
      assert.equal(evidence.remount.timeOrigin, beforeRemount.timeOrigin);
    }
    evidence.passed = true;
  } catch (error) {
    evidence.error = String(error.stack || error);
    if (browser) {
      evidence.failedBrowser = await readBrowser().catch(() => undefined);
      evidence.browserDiagnostics = await browser.diagnostics?.();
    }
    throw error;
  } finally {
    await stop();
    process.removeListener('SIGTERM', interrupt);
    process.removeListener('SIGINT', interrupt);
  }
  console.log(`PASS ${mode}: ${root}`);
}

run(process.argv[2]).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
