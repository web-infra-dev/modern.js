import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createFixture } from './dev-fixture.mjs';
import { packageAudit, testRequire } from './packages.mjs';
import {
  allocateDevPorts,
  scenarioDirectory,
  stopProcesses,
} from './dev-support.mjs';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
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

export async function runSubscriptionScenario(mode) {
  const nested = mode === 'nested';
  const staticProvider = mode === 'build-serve';
  const appMode = nested || staticProvider ? 'ordinary' : mode;
  const csr = appMode === 'service-csr';
  const ports = await allocateDevPorts({ nested });
  const root = await scenarioDirectory(`mf-subscription-${mode}-`);
  const fixture = await createFixture(root, appMode, ports);
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
  let staticServer;
  let closing;
  let failure;
  let buildRevision = 0;
  console.log(`Development ${mode} fixture: ${root}`);

  function launch(app, command = 'dev') {
    const child = spawn(
      process.execPath,
      [path.join(fixture.appTools, 'bin/modern.js'), command],
      {
        cwd: path.join(root, app),
        env: {
          ...process.env,
          NODE_ENV: command === 'dev' ? 'development' : 'production',
          MODERN_MF_AUTO_CORS: '1',
          NO_COLOR: '1',
          // Production releases have an explicit deployment identity. A
          // versionless fixture otherwise emits the same "local" ID forever.
          ...(command === 'build'
            ? { MF_BUILD_VERSION: `release-${++buildRevision}` }
            : {}),
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
      await browser?.close();
      if (staticServer?.listening) {
        staticServer.closeAllConnections();
        await new Promise(resolve => staticServer.close(resolve));
      }
      await stopProcesses(children);
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
  try {
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
    await eventually('producer manifest', () =>
      manifest(fixture.providerManifestURL),
    );
    await eventually('initial host HTTP', async () => {
      await expectHTTP('v1', 'v1');
      return true;
    });
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
    {
      browser = await defaultBrowser(root);
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
      const beforeBrowser = browser ? await readBrowser() : undefined;
      await fs.writeFile(path.join(route, file), source);
      if (staticProvider) await buildProvider();
      const next = await eventually(`${label}: producer built`, async () => {
        const next = await manifest(fixture.providerManifestURL);
        return next && version(next) !== previous && next;
      });
      // Admission discovers the manifest independently of producer notifications.
      await expectHTTP(ui, loader, heading);
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
      let current;
      if (browser) {
        // Node readiness never initiates browser navigation or loader revalidation.
        await pause(1000);
        current = await readBrowser();
        assert.equal(
          current.timeOrigin,
          beforeBrowser.timeOrigin,
          'Node readiness reloaded the document',
        );
        assert.equal(
          current.count,
          'count:1',
          'Node readiness reset browser state',
        );
        await browser.open(fixture.hostURL);
        current = await eventually(
          `${label}: manually refreshed browser`,
          async () => {
            const current = await readBrowser();
            return (
              current.ui === ui &&
              current.loader === loader &&
              current.hydrated === 'true' &&
              current.timeOrigin !== beforeBrowser.timeOrigin &&
              (!heading || current.heading.includes(heading)) &&
              current
            );
          },
        );
        assert.equal(current.count, 'count:0');
        await browser.click('#dev-counter');
        await eventually(
          'counter increment after manual refresh',
          async () => (await readBrowser()).count === 'count:1',
        );
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
  }
  console.log(`PASS ${mode}: ${root}`);
}
