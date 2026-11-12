const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createHash } = require('node:crypto');
const { createFixture, writeGeneration, colors } = require('./dev-fixture.cjs');
const { packageAudit, testRequire } = require('./packages.cjs');

const pause = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));
async function eventually(label, predicate, timeout = 90000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      last = error;
    }
    await pause(100);
  }
  throw new Error(
    `Timed out: ${label}${last ? `\n${last.stack || last}` : ''}`,
  );
}

function allocatedPort(name) {
  const port = Number(process.env[`JO_PORT_${name}`]);
  assert.ok(
    Number.isSafeInteger(port) && port > 0 && port < 65536,
    `Allocate JO_PORT_${name} before starting the dev test`,
  );
  return port;
}

async function run(mode) {
  const csr = mode === 'service-csr';
  const ordinary = mode === 'ordinary';
  const ports = {
    host: allocatedPort('HOST'),
    provider: allocatedPort('PROVIDER'),
    manifest: allocatedPort('MANIFEST'),
  };
  assert.equal(new Set(Object.values(ports)).size, 3);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), `mf-auto-dev-${mode}-`));
  const fixture = await createFixture(root, mode, ports);
  await fs.writeFile(
    path.join(root, 'packages.json'),
    JSON.stringify(packageAudit(), null, 2),
  );
  console.log(`Automatic ${mode} dev fixture: ${root}`);
  const children = [];
  const evidence = {
    mode,
    ports,
    root,
    edits: [],
    navigations: [],
    serviceRequests: [],
    serviceResponses: [],
    manifestGateway: [],
    browserConsole: [],
    browserRequests: [],
    browserErrors: [],
  };
  let browser;
  let stopping = false;
  let lastManifest;
  let lastSSRHTML;
  let frozenManifest;
  let heldServiceRequest;
  let intentionalCompilationFailure = false;
  const isExpectedCompileError = message =>
    intentionalCompilationFailure &&
    ((message.includes('src/routes/remote/version.ts') &&
      message.includes('Syntax Error: Expression expected')) ||
      /^Error:\s+× Module build failed \(from builtin:swc-loader\):\s*$/.test(
        message,
      ));
  // Only the dedicated stale-Service case freezes this otherwise transparent URL.
  const gateway = http.createServer(async (request, response) => {
    response.setHeader('cache-control', 'no-store');
    response.setHeader('access-control-allow-origin', '*');
    if (request.url?.split('?')[0] !== '/static/mf-manifest.json') {
      response.writeHead(404).end();
      return;
    }
    try {
      const text =
        frozenManifest ??
        (await fetch(fixture.providerManifestURL, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        }).then(async upstream => {
          if (!upstream.ok)
            throw new Error(`Producer manifest HTTP ${upstream.status}`);
          return upstream.text();
        }));
      response.setHeader('content-type', 'application/json');
      response.end(text);
    } catch (error) {
      response.writeHead(503).end(String(error.message));
    }
  });

  function launch(name) {
    const child = spawn(
      process.execPath,
      [path.join(fixture.appTools, 'bin/modern.js'), 'dev'],
      {
        cwd: path.join(root, name),
        detached: true,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          MODERN_MF_AUTO_CORS: '1',
          NO_COLOR: '1',
          MODERN_SERVER_LOG_LEVEL: 'warn',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const record = { name, child, log: '' };
    children.push(record);
    const log = chunk => {
      record.log += chunk;
      if (process.env.MF_LAB_VERBOSE)
        process.stdout.write(`[${mode}:${name}] ${chunk}`);
    };
    child.stdout.on('data', log);
    child.stderr.on('data', log);
    child.on('error', error => {
      record.error = error;
    });
    return record;
  }
  function assertRunning() {
    for (const { name, child, log, error } of children) {
      if (error || child.exitCode !== null || child.signalCode !== null)
        throw new Error(
          `${name} exited: ${error || child.exitCode || child.signalCode}\n${log.slice(-16000)}`,
        );
    }
  }
  async function verifyPort(record, expected) {
    await eventually(`${record.name} advertises its allocated port`, () => {
      assertRunning();
      const advertised = record.log.match(
        /Local:\s+https?:\/\/localhost:(\d+)\//,
      );
      if (!advertised) return false;
      assert.equal(
        Number(advertised[1]),
        expected,
        `${record.name} silently changed port`,
      );
      return true;
    });
  }
  const manifest = async (direct = false) => {
    assertRunning();
    const response = await fetch(
      direct ? fixture.providerManifestURL : fixture.manifestURL,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) return;
    const text = await response.text();
    const json = JSON.parse(text);
    assert.equal(
      json.name,
      fixture.providerName,
      'Unexpected producer owns the allocated port',
    );
    const value = {
      json,
      text,
      hash: createHash('sha256').update(text).digest('hex'),
    };
    if (!direct) lastManifest = value;
    return value;
  };
  const expectHTTP = async (ui, loader) =>
    eventually(
      csr ? 'HTTP CSR document shell' : `HTTP SSR ${ui}/${loader}`,
      async () => {
        assertRunning();
        const selectedManifest = await manifest();
        if (!selectedManifest) return false;
        const response = await fetch(fixture.hostURL, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        });
        const html = await response.text();
        lastSSRHTML = html;
        const frames = [
          ...html.matchAll(
            /window\.__MF_BRIDGE_SSR__\.accept\.apply\(window\.__MF_BRIDGE_SSR__,(\[[\s\S]*?\])\)<\/script>/g,
          ),
        ].map(match => JSON.parse(match[1])[1]);
        if (csr) {
          evidence.lastCSRDocument = {
            status: response.status,
            bridgeFrames: frames.length,
          };
          assert.ok(
            response.ok &&
              html.includes('id="root"') &&
              !frames.length &&
              !html.includes('data-testid="dev-remote"'),
            'CSR Host must serve a shell without provider SSR output',
          );
          await fs.writeFile(path.join(root, 'csr-shell.html'), html);
          return html;
        }
        const providerHTML = ordinary
          ? html
          : frames
              .filter(frame => frame.type === 'html')
              .map(frame => frame.html)
              .join('');
        evidence.lastSSR = {
          status: response.status,
          expectedUI: ui,
          expectedLoader: loader,
          host: html.includes(`Automatic ${mode} development update`),
          provider: providerHTML.includes('data-testid="dev-remote"'),
          ui: providerHTML.includes(`data-ui="${ui}"`),
          loader: providerHTML.includes(`data-loader="${loader}"`),
          frames: frames.map(frame => frame.type),
          // Compiler identity and each Node/browser execution are independent.
          compiledIdentity: providerHTML.match(/data-build-id="([^"]+)"/)?.[1],
        };
        assert.ok(
          response.ok &&
            evidence.lastSSR.host &&
            evidence.lastSSR.provider &&
            evidence.lastSSR.ui &&
            evidence.lastSSR.loader &&
            evidence.lastSSR.compiledIdentity &&
            (ordinary
              ? !frames.length
              : frames.some(frame => frame.type === 'done')) &&
            !frames.some(frame => frame.type === 'error'),
          `SSR provider/loader frames are not ready: ${JSON.stringify(evidence.lastSSR)}`,
        );
        await fs.writeFile(path.join(root, `ssr-${ui}-${loader}.html`), html);
        return html;
      },
    );
  async function stop() {
    if (stopping) return;
    stopping = true;
    frozenManifest = undefined;
    await heldServiceRequest?.abort().catch(() => {});
    await browser?.close().catch(() => {});
    if (gateway.listening) {
      const closed = new Promise(resolve => gateway.close(resolve));
      gateway.closeAllConnections();
      await closed;
    }
    await Promise.all(
      children.map(async ({ child }) => {
        if (child.exitCode !== null || child.signalCode !== null) return;
        const exited = once(child, 'exit');
        try {
          process.kill(-child.pid, 'SIGTERM');
        } catch {}
        if (
          !(await Promise.race([
            exited.then(() => true),
            pause(5000).then(() => false),
          ]))
        ) {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch {}
          await exited;
        }
      }),
    );
    await Promise.all(
      children.map(({ name, log }) =>
        fs.writeFile(path.join(root, `${name}.log`), log),
      ),
    );
    if (lastSSRHTML !== undefined)
      await fs.writeFile(path.join(root, 'last-ssr.html'), lastSSRHTML);
    evidence.processes = children.map(({ name, child }) => ({
      name,
      pid: child.pid,
      exitCode: child.exitCode,
      signal: child.signalCode,
    }));
    await fs.writeFile(
      path.join(root, 'result.json'),
      JSON.stringify(evidence, null, 2),
    );
  }
  const interrupt = () => {
    void stop().finally(() => process.exit(130));
  };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    await new Promise((resolve, reject) => {
      gateway.once('error', reject);
      gateway.listen(ports.manifest, resolve);
    });
    assert.equal(gateway.address().port, ports.manifest);
    const provider = launch('provider');
    const initialManifest = await eventually('producer manifest', () =>
      manifest(),
    );
    await verifyPort(provider, ports.provider);
    const host = launch('host');
    await expectHTTP('v1', 'v1');
    await verifyPort(host, ports.host);
    browser = await testRequire('puppeteer').launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      userDataDir: path.join(root, 'browser-profile'),
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => {
      const message = String(error);
      const expectedCompilationFailure = isExpectedCompileError(message);
      evidence.browserErrors.push({
        page: 'main',
        message,
        expectedCompilationFailure,
      });
      if (!expectedCompilationFailure) errors.push(message);
    });
    page.on('console', message => {
      const expectedCompilationFailure = isExpectedCompileError(message.text());
      evidence.browserConsole.push({
        page: 'main',
        type: message.type(),
        text: message.text(),
        expectedCompilationFailure,
      });
      if (message.type() === 'error' && !expectedCompilationFailure)
        errors.push(message.text());
    });
    page.on('request', request => {
      evidence.browserRequests.push({
        page: 'main',
        method: request.method(),
        type: request.resourceType(),
        url: request.url(),
        at: Date.now(),
      });
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        evidence.navigations.push({ url: request.url(), at: Date.now() });
      if (
        request.method() === 'POST' &&
        request.url().includes('/_modern/mf/service/')
      )
        evidence.serviceRequests.push({
          url: request.url(),
          body: request.postData(),
          at: Date.now(),
        });
    });
    function recordServiceResponse(response, label) {
      if (
        response.request().method() === 'POST' &&
        response.url().includes('/_modern/mf/service/')
      ) {
        if (csr && response.ok()) return;
        const record = {
          page: label,
          url: response.url(),
          status: response.status(),
          at: Date.now(),
        };
        evidence.serviceResponses.push(record);
      }
    }
    async function installServiceRecorder(target, label) {
      if (!csr) return;
      await target.exposeFunction('__recordServiceResponse', value => {
        const record = { ...value, page: label, at: Date.now() };
        try {
          if (value.body)
            record.frames = value.body
              .trim()
              .split('\n')
              .map(line => JSON.parse(line));
        } catch (error) {
          record.error = String(error);
        }
        evidence.serviceResponses.push(record);
      });
      await target.evaluateOnNewDocument(() => {
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (...args) => {
          const response = await originalFetch(...args);
          if (response.ok && response.url.includes('/_modern/mf/service/')) {
            // Copy the real stream for evidence without delaying Core's original reader.
            void response
              .clone()
              .text()
              .then(body =>
                window.__recordServiceResponse({
                  url: response.url,
                  status: response.status,
                  body,
                }),
              )
              .catch(error =>
                window.__recordServiceResponse({
                  url: response.url,
                  status: response.status,
                  error: String(error),
                }),
              );
          }
          return response;
        };
      });
    }
    page.on('response', response => recordServiceResponse(response, 'main'));
    await installServiceRecorder(page, 'main');
    await page.goto(fixture.hostURL, { waitUntil: 'load' });
    async function expectBrowser(
      ui,
      loader,
      color,
      target = page,
      serviceSince = 0,
    ) {
      await target.bringToFront();
      await target.waitForFunction(
        expected => {
          const remote = document.querySelector('[data-testid="dev-remote"]');
          return (
            remote?.getAttribute('data-ui') === expected.ui &&
            remote?.getAttribute('data-loader') === expected.loader &&
            getComputedStyle(remote).color === expected.color &&
            document
              .querySelector('#dev-counter')
              ?.getAttribute('data-hydrated') === 'true'
          );
        },
        { timeout: 90000, polling: 100 },
        { ui, loader, color },
      );
      const identity = await target.$eval(
        '[data-testid="dev-remote"]',
        node => ({
          runtime: node.getAttribute('data-runtime-id'),
          compiled: node.getAttribute('data-build-id'),
        }),
      );
      const selected = await manifest();
      assert.ok(identity.compiled.startsWith(`${fixture.providerName}:`));
      assert.equal(
        identity.runtime,
        identity.compiled,
        'The browser keeps its compiler identity across content revisions',
      );
      evidence.identities ||= [];
      evidence.identities.push({
        ui,
        loader,
        ...identity,
        manifestVersion: selected.json.metaData.buildInfo.buildVersion,
      });
      const before = await target.$eval(
        '#dev-counter',
        node => node.textContent,
      );
      await target.click('#dev-counter');
      await target.waitForFunction(
        previous =>
          document.querySelector('#dev-counter')?.textContent !== previous,
        {},
        before,
      );
      if (csr)
        await eventually(`real Service HTTP HTML ${ui}/${loader}`, () =>
          evidence.serviceResponses.some(response => {
            if (
              response.status !== 200 ||
              response.at < serviceSince ||
              response.page !== (target === page ? 'main' : 'stale-service')
            )
              return false;
            const frames = response.frames || [];
            const html = frames
              .filter(frame => frame.type === 'html')
              .map(frame => frame.html)
              .join('');
            return (
              html.includes('data-testid="dev-remote"') &&
              html.includes(`data-ui="${ui}"`) &&
              html.includes(`data-loader="${loader}"`) &&
              frames.some(frame => frame.type === 'done') &&
              !frames.some(frame => frame.type === 'error')
            );
          }),
        );
    }
    async function stableNavigation(label) {
      const count = evidence.navigations.length;
      await pause(2500);
      assert.equal(
        evidence.navigations.length,
        count,
        `${label}: reload loop or duplicate delayed reload`,
      );
    }
    async function edit(
      label,
      values,
      action = () => writeGeneration(root, values),
    ) {
      const before = (await manifest().catch(() => undefined)) || lastManifest;
      const navigations = evidence.navigations.length;
      const started = Date.now();
      await action();
      const current = await eventually(
        `${label}: successful compilation changes manifest`,
        async () => {
          const value = await manifest();
          return (
            value &&
            value.hash !== before.hash &&
            value.json.metaData.buildInfo.buildVersion !==
              before.json.metaData.buildInfo.buildVersion &&
            value
          );
        },
      );
      await expectHTTP(values.ui, values.loader);
      await eventually(
        `${label}: automatic document reload`,
        () => evidence.navigations.length > navigations,
      );
      await expectBrowser(
        values.ui,
        values.loader,
        values.color,
        page,
        started,
      );
      assert.ok(
        evidence.navigations.length > navigations,
        `${label}: the existing browser did not automatically reload`,
      );
      assert.equal(
        new URL(page.url()).searchParams.has('csr'),
        false,
        `${label}: recovery must not change the document's rendering mode`,
      );
      evidence.edits.push({
        label,
        ...values,
        elapsedMs: Date.now() - started,
        oldManifest: before.hash,
        newManifest: current.hash,
        oldBuildVersion: before.json.metaData.buildInfo.buildVersion,
        newBuildVersion: current.json.metaData.buildInfo.buildVersion,
        documentLoads: evidence.navigations.length - navigations,
      });
      await stableNavigation(label);
    }
    await expectBrowser('v1', 'v1', colors.first);
    assert.ok(initialManifest.json);
    await edit('component and loader change', {
      ui: 'v2',
      loader: 'v2',
      color: colors.second,
    });
    await edit(
      'CSS-only change',
      { ui: 'v2', loader: 'v2', color: colors.css },
      () =>
        fs.writeFile(
          path.join(root, 'provider/src/routes/remote/remote.css'),
          `[data-testid="dev-remote"] { color: ${colors.css}; }\n`,
        ),
    );
    await edit(
      'loader-only change',
      { ui: 'v2', loader: 'loader3', color: colors.css },
      () =>
        fs.writeFile(
          path.join(root, 'provider/src/routes/remote/page.data.ts'),
          `export const loader = async () => ({version: 'loader3'});\n`,
        ),
    );

    const syntaxFile = path.join(root, 'provider/src/routes/remote/version.ts');
    const logStart = provider.log.length;
    const navigationBeforeError = evidence.navigations.length;
    intentionalCompilationFailure = true;
    await fs.writeFile(syntaxFile, 'export const version = ;\n');
    await eventually('producer reports syntax failure', () =>
      /(?:Unexpected token|Expression expected|Expected|Syntax Error|Module build failed|error\s)/i.test(
        provider.log.slice(logStart),
      ),
    );
    await eventually(
      'failed compilation keeps the producer manifest unavailable',
      async () => {
        const response = await fetch(fixture.providerManifestURL, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });
        const body = await response.text();
        evidence.compilationFailure = {
          manifestStatus: response.status,
          cacheControl: response.headers.get('cache-control'),
          body,
        };
        return (
          response.status === 503 &&
          response.headers.get('cache-control')?.includes('no-store')
        );
      },
      15000,
    );
    await pause(2000);
    assert.equal(
      evidence.navigations.length,
      navigationBeforeError,
      'A failed producer compilation reloaded the consumer',
    );
    await edit('compilation error recovery', {
      ui: 'v3',
      loader: 'v3',
      color: colors.first,
    });
    intentionalCompilationFailure = false;
    await edit(
      'rapid saves converge',
      { ui: 'v5', loader: 'v5', color: colors.second },
      async () => {
        await writeGeneration(root, {
          ui: 'v4',
          loader: 'v4',
          color: colors.first,
        });
        await writeGeneration(root, {
          ui: 'v5',
          loader: 'v5',
          color: colors.second,
        });
      },
    );
    if (mode.startsWith('service')) {
      const latePage = await browser.newPage();
      const oldManifest = await manifest();
      const recovery = {
        navigations: [],
        serviceRequests: [],
        oldManifest: oldManifest.hash,
      };
      evidence.serviceRecovery = recovery;
      let awaitingService = true;
      let mismatch;
      let mismatchError;
      let staleBody;
      latePage.on('pageerror', error => errors.push(String(error)));
      latePage.on('console', message => {
        const text = message.text();
        const expectedMismatch =
          /BridgeServiceVersionMismatchError|BRIDGE_SERVICE_VERSION_MISMATCH|buildVersion mismatch|Failed to load resource:.*409/.test(
            text,
          );
        evidence.browserConsole.push({
          page: 'stale-service',
          type: message.type(),
          text,
          expectedMismatch,
        });
        if (message.type() === 'error' && !expectedMismatch) errors.push(text);
      });
      latePage.on('request', request => {
        if (
          request.method() === 'POST' &&
          request.url().includes('/_modern/mf/service/')
        ) {
          recovery.serviceRequests.push({
            at: Date.now(),
            body: JSON.parse(request.postData()),
          });
        }
        evidence.browserRequests.push({
          page: 'stale-service',
          method: request.method(),
          type: request.resourceType(),
          url: request.url(),
          at: Date.now(),
        });
        if (
          request.isNavigationRequest() &&
          request.frame() === latePage.mainFrame()
        )
          recovery.navigations.push({
            url: request.url(),
            at: Date.now(),
          });
        if (
          awaitingService &&
          request.method() === 'POST' &&
          request.url().includes('/_modern/mf/service/')
        ) {
          awaitingService = false;
          heldServiceRequest = request;
          staleBody = JSON.parse(request.postData());
          recovery.request = {
            url: request.url(),
            body: staleBody,
            at: Date.now(),
          };
          return;
        }
        void request.continue().catch(() => {});
      });
      latePage.on('response', response => {
        recordServiceResponse(response, 'stale-service');
      });
      try {
        await installServiceRecorder(latePage, 'stale-service');
        // Capture the actual response before automatic navigation discards its CDP body.
        // Only clone it for evidence. The original response still reaches Core unchanged.
        await latePage.exposeFunction('__recordServiceMismatch', value => {
          if (value.error) mismatchError = new Error(value.error);
          else mismatch = value;
          frozenManifest = undefined;
          evidence.manifestGateway.push({
            event: 'release-after-typed-409',
            at: Date.now(),
          });
        });
        await latePage.evaluateOnNewDocument(() => {
          const originalFetch = window.fetch.bind(window);
          window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (
              response.status === 409 &&
              response.url.includes('/_modern/mf/service/') &&
              response.headers
                .get('content-type')
                ?.startsWith(
                  'application/vnd.module-federation.bridge-service-error+json',
                )
            ) {
              try {
                await window.__recordServiceMismatch({
                  status: response.status,
                  headers: Object.fromEntries(response.headers),
                  body: await response.clone().json(),
                });
              } catch (error) {
                await window.__recordServiceMismatch({
                  error: String(error),
                });
              }
            }
            return response;
          };
        });
        await latePage.setRequestInterception(true);
        await latePage.goto(`${fixture.hostURL}/?late=1`, {
          waitUntil: 'load',
        });
        await latePage.waitForSelector('#dev-toggle');
        // The next real document load should render the remote through SSR.
        await latePage.evaluate(() => history.replaceState(null, '', '/'));
        frozenManifest = oldManifest.text;
        evidence.manifestGateway.push({
          event: 'freeze-for-stale-service',
          hash: oldManifest.hash,
          at: Date.now(),
        });
        await latePage.click('#dev-toggle');
        await eventually(
          'actual browser Service POST is pending',
          () => heldServiceRequest,
        );
        assert.equal(
          staleBody.buildVersion,
          oldManifest.json.metaData.buildInfo.buildVersion,
        );
        const navigations = recovery.navigations.length;
        await writeGeneration(root, {
          ui: 'v6',
          loader: 'v6',
          color: colors.first,
        });
        const nextManifest = await eventually(
          'producer compiled behind frozen manifest URL',
          async () => {
            const value = await manifest(true);
            return value && value.hash !== oldManifest.hash && value;
          },
        );
        assert.equal(
          (await manifest()).hash,
          oldManifest.hash,
          'The consumer must still see the old manifest',
        );
        assert.equal(
          recovery.navigations.length,
          navigations,
          'The stale browser was refreshed before its Service response',
        );
        const pending = heldServiceRequest;
        heldServiceRequest = undefined;
        await pending.continue();
        await eventually(
          'producer returns typed version mismatch through ingress',
          () => mismatch || mismatchError,
        );
        if (mismatchError) throw mismatchError;
        assert.equal(
          mismatch.body.protocol,
          'module-federation/bridge-ssr/producer/v1',
        );
        assert.equal(mismatch.body.code, 'BRIDGE_SERVICE_VERSION_MISMATCH');
        assert.equal(
          mismatch.body.expectedBuildVersion,
          staleBody.buildVersion,
        );
        assert.equal(
          mismatch.body.actualBuildVersion,
          nextManifest.json.metaData.buildInfo.buildVersion,
        );
        assert.notEqual(
          mismatch.body.actualBuildVersion,
          mismatch.body.expectedBuildVersion,
        );
        recovery.response = mismatch;
        recovery.newManifest = nextManifest.hash;
        await expectHTTP('v6', 'v6');
        await eventually(
          'typed Service mismatch automatically reloads the document',
          () => recovery.navigations.length > navigations,
        );
        await expectBrowser('v6', 'v6', colors.first, latePage);
        assert.ok(
          recovery.navigations.length > navigations,
          'Typed Service mismatch did not automatically reload the document',
        );
        assert.equal(new URL(latePage.url()).searchParams.has('csr'), false);
        const settled = recovery.navigations.length;
        await pause(3000);
        assert.equal(
          recovery.navigations.length,
          settled,
          'Typed Service recovery entered a document reload loop',
        );
        recovery.documentLoads = settled - navigations;
        assert.equal(
          recovery.serviceRequests.filter(
            request => request.body.buildVersion === staleBody.buildVersion,
          ).length,
          1,
          'The stale Service POST was replayed during recovery',
        );
        await expectBrowser('v6', 'v6', colors.first);
        await stableNavigation('Service recovery');
      } finally {
        frozenManifest = undefined;
        await heldServiceRequest?.abort().catch(() => {});
        heldServiceRequest = undefined;
        await latePage.close();
      }
    }
    assert.deepEqual(errors, [], 'Unexpected browser execution errors');
    evidence.passed = true;
    console.log(
      `${mode}: automatic source updates, CSS, loaders, error recovery and reload stability passed`,
    );
  } catch (error) {
    evidence.failure = String(error.stack || error);
    for (const { name, log } of children)
      console.error(`[${name}]\n${log.slice(-16000)}`);
    throw error;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    await stop();
  }
}

(async () => {
  const modes =
    process.argv.length > 2 ? process.argv.slice(2) : ['bridge', 'service'];
  for (const mode of modes) await run(mode);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
