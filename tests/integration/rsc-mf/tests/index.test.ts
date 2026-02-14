import fs from 'fs';
import path from 'path';
import { isVersionAtLeast18 } from '@modern-js/utils';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
  sleep,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../');
const hostDir = path.resolve(fixtureDir, 'host');
const remoteDir = path.resolve(fixtureDir, 'remote');
const HOST_RSC_URL = '/server-component-root';
const EXPECTED_ACTION_POSTS_PER_MODE = 24;
const EXPECTED_ACTION_POSTS_PER_FAMILY = 6;
const EXPECTED_UNIQUE_ACTION_IDS_PER_MODE = 4;
const EXPECTED_REMOTE_EXPOSE_PATHS = [
  './RemoteClientCounter',
  './RemoteClientBadge',
  './RemoteServerCard',
  './RemoteServerDefault',
  './AsyncRemoteServerInfo',
  './remoteServerOnly',
  './remoteServerOnlyDefault',
  './remoteMeta',
  './actions',
  './nestedActions',
  './defaultAction',
  './actionBundle',
  './infoBundle',
].sort();
const REMOTE_EXPOSE_ENTRY_PATTERN =
  /'(\.\/[^']+)':\s*'(\.\/src\/components\/[^']+)'/g;

type Mode = 'dev' | 'build';

interface TestConfig {
  mode: Mode;
}

interface TestContext {
  hostPort: number;
  page: Page;
  actionRequestIds?: string[];
}

async function waitForActionRequestCount({
  actionRequestIds,
  minimumCount,
  timeoutMs = 15000,
}: {
  actionRequestIds: string[];
  minimumCount: number;
  timeoutMs?: number;
}) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (actionRequestIds.length >= minimumCount) {
      return;
    }
    await sleep(50);
  }

  throw new Error(
    `Timed out waiting for action request count ${minimumCount}, received ${actionRequestIds.length}`,
  );
}

function skipForLowerNodeVersion() {
  if (!isVersionAtLeast18()) {
    test('should skip in lower node version', () => {
      expect(true).toBe(true);
    });
    return true;
  }
  return false;
}

function createRemoteEnv(remotePort: number) {
  return {
    RSC_MF_REMOTE_PORT: String(remotePort),
    MODERN_MF_AUTO_CORS: 'true',
  };
}

function createHostEnv(remotePort: number) {
  return {
    RSC_MF_REMOTE_PORT: String(remotePort),
  };
}

function getRemoteExposeEntries(configSource: string) {
  return Array.from(configSource.matchAll(REMOTE_EXPOSE_ENTRY_PATTERN)).map(
    ([, exposeKey, importPath]) => ({
      exposeKey,
      importPath,
    }),
  );
}

async function renderRemoteRscIntoHost({ hostPort, page }: TestContext) {
  const response = await fetch(`http://127.0.0.1:${hostPort}${HOST_RSC_URL}`);
  const html = await response.text();
  expect(html).toContain('Host RSC Module Federation');
  expect(html).toContain('Remote Federated Tree');
  expect(html).toContain('remote-server-only-ok');
  expect(html).toContain('remote-server-only-default-ok');
  expect(html).toContain('remote-meta-default');
  expect(html).toContain('rsc|mf|actions');
  expect(html).toContain('remote-async-server-info-ok');
  expect(html).toContain('Remote Default Server Card');
  expect(html).toContain('host-remote-bundled-server-only');
  expect(html).toContain('host-remote-bundled-meta-kind');

  await page.goto(`http://127.0.0.1:${hostPort}${HOST_RSC_URL}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });
  const hostRemoteServerOnly = await page.$eval(
    '.host-remote-server-only',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteServerOnly).toBe('remote-server-only-ok');
  const hostRemoteServerOnlyDefault = await page.$eval(
    '.host-remote-server-only-default',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteServerOnlyDefault).toBe('remote-server-only-default-ok');
  const hostRemoteMetaKind = await page.$eval('.host-remote-meta-kind', el =>
    el.textContent?.trim(),
  );
  expect(hostRemoteMetaKind).toBe('remote-meta-default');
  const hostRemoteMetaLabel = await page.$eval('.host-remote-meta-label', el =>
    el.textContent?.trim(),
  );
  expect(hostRemoteMetaLabel).toBe('rsc|mf|actions');
  const hostRemoteBundledServerOnly = await page.$eval(
    '.host-remote-bundled-server-only',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteBundledServerOnly).toBe('remote-server-only-ok');
  const hostRemoteBundledServerOnlyDefault = await page.$eval(
    '.host-remote-bundled-server-only-default',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteBundledServerOnlyDefault).toBe(
    'remote-server-only-default-ok',
  );
  const hostRemoteBundledMetaKind = await page.$eval(
    '.host-remote-bundled-meta-kind',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteBundledMetaKind).toBe('remote-meta-default');
  const hostRemoteBundledMetaLabel = await page.$eval(
    '.host-remote-bundled-meta-label',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteBundledMetaLabel).toBe('rsc|mf|actions');
  const hostRemoteAsyncServerInfo = await page.$eval(
    '.remote-async-server-info',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteAsyncServerInfo).toBe('remote-async-server-info-ok');
}

async function supportRemoteClientAndServerActions({
  hostPort,
  page,
  actionRequestIds,
}: TestContext) {
  await page.goto(`http://127.0.0.1:${hostPort}${HOST_RSC_URL}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });
  await page.waitForSelector(
    '.host-remote-action-runner .remote-client-local-increment',
  );

  let localCount = await page.$eval(
    '.host-remote-action-runner .remote-client-local-count',
    el => el.textContent?.trim(),
  );
  let serverCount = await page.$eval(
    '.host-remote-action-runner .remote-client-server-count',
    el => el.textContent?.trim(),
  );
  expect(localCount).toBe('0');
  expect(serverCount).toBe('0');

  await page.click('.host-remote-action-runner .remote-client-local-increment');
  localCount = await page.$eval(
    '.host-remote-action-runner .remote-client-local-count',
    el => el.textContent?.trim(),
  );
  expect(localCount).toBe('1');

  await page.click(
    '.host-remote-action-runner .remote-client-server-increment',
  );
  await page.waitForFunction(
    () =>
      !document
        .querySelector(
          '.host-remote-action-runner .remote-client-server-increment',
        )
        ?.hasAttribute('disabled'),
  );
  serverCount = await page.$eval(
    '.host-remote-action-runner .remote-client-server-count',
    el => el.textContent?.trim(),
  );
  expect(serverCount).toBe('1');
  await page.click(
    '.host-remote-action-runner .remote-client-server-increment',
  );
  await page.waitForFunction(
    () =>
      !document
        .querySelector(
          '.host-remote-action-runner .remote-client-server-increment',
        )
        ?.hasAttribute('disabled'),
  );
  serverCount = await page.$eval(
    '.host-remote-action-runner .remote-client-server-count',
    el => el.textContent?.trim(),
  );
  expect(serverCount).toBe('2');

  const actionRequestCountBeforeFirstClientRun = actionRequestIds?.length || 0;
  await page.click('.host-remote-action-runner .remote-client-run-actions');
  const actionRequestCountAfterFirstClientRun =
    actionRequestCountBeforeFirstClientRun + 3;
  await page.waitForFunction(() => {
    const nested = document.querySelector(
      '.host-remote-action-runner .remote-client-nested-result',
    );
    const remoteAction = document.querySelector(
      '.host-remote-action-runner .remote-client-remote-action-result',
    );
    const defaultAction = document.querySelector(
      '.host-remote-action-runner .remote-client-default-action-result',
    );
    return (
      nested?.textContent?.trim() === 'nested-action:from-client' &&
      remoteAction?.textContent?.trim() === 'remote-action:from-client' &&
      defaultAction?.textContent?.trim() === 'default-action:from-client'
    );
  });
  if (actionRequestIds) {
    await waitForActionRequestCount({
      actionRequestIds,
      minimumCount: actionRequestCountAfterFirstClientRun,
    });
  }

  const actionRequestCountBeforeSecondClientRun = actionRequestIds?.length || 0;
  await page.click('.host-remote-action-runner .remote-client-run-actions');
  const actionRequestCountAfterSecondClientRun =
    actionRequestCountBeforeSecondClientRun + 3;
  await page.waitForFunction(() => {
    const nested = document.querySelector(
      '.host-remote-action-runner .remote-client-nested-result',
    );
    const remoteAction = document.querySelector(
      '.host-remote-action-runner .remote-client-remote-action-result',
    );
    const defaultAction = document.querySelector(
      '.host-remote-action-runner .remote-client-default-action-result',
    );
    return (
      nested?.textContent?.trim() === 'nested-action:from-client' &&
      remoteAction?.textContent?.trim() === 'remote-action:from-client' &&
      defaultAction?.textContent?.trim() === 'default-action:from-client'
    );
  });
  if (actionRequestIds) {
    await waitForActionRequestCount({
      actionRequestIds,
      minimumCount: actionRequestCountAfterSecondClientRun,
    });
  }

  let badgeValue = await page.$eval(
    '.host-remote-action-runner .remote-client-badge-value',
    el => el.textContent?.trim(),
  );
  expect(badgeValue).toBe('remote-client-badge-initial');
  await page.click('.host-remote-action-runner .remote-client-badge-toggle');
  badgeValue = await page.$eval(
    '.host-remote-action-runner .remote-client-badge-value',
    el => el.textContent?.trim(),
  );
  expect(badgeValue).toBe('remote-client-badge-toggled');

  await page.click('.host-remote-run-actions');
  await page.waitForFunction(() => {
    const defaultActionResult = document.querySelector(
      '.host-remote-default-action-result',
    );
    const echoActionResult = document.querySelector(
      '.host-remote-echo-action-result',
    );
    const nestedActionResult = document.querySelector(
      '.host-remote-nested-action-result',
    );
    const incrementActionResult = document.querySelector(
      '.host-remote-increment-action-result',
    );
    const bundledDefaultActionResult = document.querySelector(
      '.host-remote-bundled-default-action-result',
    );
    const bundledEchoActionResult = document.querySelector(
      '.host-remote-bundled-echo-action-result',
    );
    const bundledNestedActionResult = document.querySelector(
      '.host-remote-bundled-nested-action-result',
    );
    const bundledIncrementActionResult = document.querySelector(
      '.host-remote-bundled-increment-action-result',
    );
    return (
      defaultActionResult?.textContent?.trim() ===
        'default-action:from-host-client' &&
      echoActionResult?.textContent?.trim() ===
        'remote-action:from-host-client' &&
      nestedActionResult?.textContent?.trim() ===
        'nested-action:from-host-client-direct' &&
      incrementActionResult?.textContent?.trim() === '3' &&
      bundledDefaultActionResult?.textContent?.trim() ===
        'default-action:from-host-client-bundled' &&
      bundledEchoActionResult?.textContent?.trim() ===
        'remote-action:from-host-client-bundled' &&
      bundledNestedActionResult?.textContent?.trim() ===
        'nested-action:from-host-client-bundled' &&
      bundledIncrementActionResult?.textContent?.trim() === '4'
    );
  });

  await page.click('.host-remote-run-actions');
  await page.waitForFunction(() => {
    const incrementActionResult = document.querySelector(
      '.host-remote-increment-action-result',
    );
    const bundledIncrementActionResult = document.querySelector(
      '.host-remote-bundled-increment-action-result',
    );
    return (
      incrementActionResult?.textContent?.trim() === '5' &&
      bundledIncrementActionResult?.textContent?.trim() === '6'
    );
  });
}

function runTests({ mode }: TestConfig) {
  describe(mode, () => {
    let remoteApp: any;
    let hostApp: any;
    let remotePort: number;
    let hostPort: number;
    let page: Page;
    let browser: Browser;
    const runtimeErrors: string[] = [];
    const actionRequestUrls: string[] = [];
    const actionRequestIds: string[] = [];
    const actionRequestAcceptHeaders: string[] = [];
    const registerCallbackExposeRequestUrls: string[] = [];

    if (skipForLowerNodeVersion()) {
      return;
    }

    beforeAll(async () => {
      jest.setTimeout(1000 * 60 * 8);
      remotePort = await getPort();
      hostPort = await getPort();

      const remoteEnv = createRemoteEnv(remotePort);
      const hostEnv = createHostEnv(remotePort);

      if (mode === 'dev') {
        remoteApp = await launchApp(remoteDir, remotePort, {}, remoteEnv);
        await sleep(2000);

        hostApp = await launchApp(hostDir, hostPort, {}, hostEnv);
        await sleep(2000);
      } else {
        await modernBuild(remoteDir, [], { env: remoteEnv });
        await modernBuild(hostDir, [], { env: hostEnv });

        remoteApp = await modernServe(remoteDir, remotePort, {
          env: {
            PORT: String(remotePort),
            NODE_ENV: 'production',
            ...remoteEnv,
          },
        });
        await sleep(2000);

        hostApp = await modernServe(hostDir, hostPort, {
          env: {
            PORT: String(hostPort),
            NODE_ENV: 'production',
            ...hostEnv,
          },
        });
        await sleep(2000);
      }

      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();

      page.on('pageerror', error => {
        const err = error as Error;
        const message = err.message;
        runtimeErrors.push(message);
      });

      page.on('request', request => {
        const headers = request.headers();
        const url = request.url();
        if (url.includes('__federation_expose_registerServerCallback')) {
          registerCallbackExposeRequestUrls.push(url);
        }
        if (request.method() !== 'POST' || !headers['x-rsc-action']) {
          return;
        }
        actionRequestUrls.push(url);
        actionRequestIds.push(headers['x-rsc-action']);
        actionRequestAcceptHeaders.push(headers.accept || '');
      });
    });

    afterAll(async () => {
      if (browser) {
        await browser.close();
      }
      if (hostApp) {
        await killApp(hostApp);
      }
      if (remoteApp) {
        await killApp(remoteApp);
      }
    });

    it('should render remote RSC content in host app', () =>
      renderRemoteRscIntoHost({ hostPort, page }));

    it('should not require exposing callback registration helper', async () => {
      const manifestResponse = await fetch(
        `http://127.0.0.1:${remotePort}/static/mf-manifest.json`,
      );
      expect(manifestResponse.ok).toBe(true);
      const manifest = (await manifestResponse.json()) as {
        exposes?: Array<{ path?: string }>;
      };
      const exposedPaths = (manifest.exposes || [])
        .map(item => item.path)
        .filter((path): path is string => Boolean(path));
      const uniqueExposedPaths = Array.from(new Set(exposedPaths)).sort();
      expect(exposedPaths).not.toContain('./registerServerCallback');
      expect(uniqueExposedPaths.length).toBeGreaterThan(0);
      expect(uniqueExposedPaths).toContain('./RemoteClientCounter');
      expect(
        uniqueExposedPaths.every(path =>
          EXPECTED_REMOTE_EXPOSE_PATHS.includes(path),
        ),
      ).toBe(true);
      expect(uniqueExposedPaths.length).toBeLessThanOrEqual(
        EXPECTED_REMOTE_EXPOSE_PATHS.length,
      );
      expect(
        exposedPaths.every(path => !path.startsWith('./src/components/')),
      ).toBe(true);
      expect(
        exposedPaths.every(path => !path.includes('initServerCallback')),
      ).toBe(true);
    });

    it('should keep callback runtime wiring out of component sources', () => {
      const getFilesRecursively = (directory: string): string[] =>
        fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
          const entryPath = path.join(directory, entry.name);
          if (entry.isDirectory()) {
            return getFilesRecursively(entryPath);
          }
          return [entryPath];
        });

      const componentFilePaths = getFilesRecursively(
        path.join(remoteDir, 'src/components'),
      );
      const hostSourceFilePaths = getFilesRecursively(
        path.join(hostDir, 'src'),
      ).filter(filePath => /\.(ts|tsx)$/.test(filePath));

      const componentSources = componentFilePaths.map(filePath =>
        fs.readFileSync(filePath, 'utf-8'),
      );
      const hostSourceTexts = hostSourceFilePaths.map(filePath =>
        fs.readFileSync(filePath, 'utf-8'),
      );
      const runtimeInitSource = fs.readFileSync(
        path.join(remoteDir, 'src/runtime/initServerCallback.ts'),
        'utf-8',
      );
      const runtimeRegisterSource = fs.readFileSync(
        path.join(remoteDir, 'src/runtime/registerServerCallback.ts'),
        'utf-8',
      );
      const moduleFederationConfigSource = fs.readFileSync(
        path.join(remoteDir, 'module-federation.config.ts'),
        'utf-8',
      );
      const hostModuleFederationConfigSource = fs.readFileSync(
        path.join(hostDir, 'module-federation.config.ts'),
        'utf-8',
      );
      const hostModernConfigSource = fs.readFileSync(
        path.join(hostDir, 'modern.config.ts'),
        'utf-8',
      );
      const remoteModernConfigSource = fs.readFileSync(
        path.join(remoteDir, 'modern.config.ts'),
        'utf-8',
      );
      const remoteRuntimeExposesDir = path.join(
        remoteDir,
        'src/runtime/exposes',
      );
      const remoteRuntimeExposeEntries = fs.existsSync(remoteRuntimeExposesDir)
        ? fs
            .readdirSync(remoteRuntimeExposesDir)
            .filter(entryName => !entryName.startsWith('.'))
        : [];
      const remoteRuntimeEntries = fs
        .readdirSync(path.join(remoteDir, 'src/runtime'))
        .filter(entryName => !entryName.startsWith('.'))
        .sort();
      const remoteRuntimeEntriesWithoutExposeDir = remoteRuntimeEntries.filter(
        entryName => entryName !== 'exposes',
      );
      const remoteExposeEntries = getRemoteExposeEntries(
        moduleFederationConfigSource,
      );
      const remoteExposeKeys = remoteExposeEntries
        .map(({ exposeKey }) => exposeKey)
        .sort();
      const clientBrowserSharedScopeEntryCount = (
        moduleFederationConfigSource.match(
          /'react-server-dom-rspack\/client\.browser':\s*\{/g,
        ) || []
      ).length;

      expect(
        componentSources.every(
          source => !source.includes('initServerCallback'),
        ),
      ).toBe(true);
      expect(
        componentSources.every(
          source => !source.includes('registerRemoteServerCallback'),
        ),
      ).toBe(true);
      expect(
        componentSources.every(
          source =>
            !source.includes('setServerCallback') &&
            !source.includes('rsc-mf-react-server-dom-client-browser'),
        ),
      ).toBe(true);
      expect(
        hostSourceTexts.every(
          source =>
            !source.includes('registerRemoteServerCallback') &&
            !source.includes('initServerCallback') &&
            !source.includes('registerServerCallback') &&
            !source.includes('setServerCallback') &&
            !source.includes('rsc-mf-react-server-dom-client-browser'),
        ),
      ).toBe(true);
      expect(runtimeInitSource).toContain('registerRemoteServerCallback');
      expect(runtimeInitSource).toContain('bootstrapServerCallback');
      expect(runtimeInitSource).toContain('callbackBootstrapPromise');
      expect(runtimeInitSource).toContain("if (typeof window !== 'undefined')");
      expect(runtimeInitSource).toContain("import('./registerServerCallback')");
      expect(runtimeInitSource).toContain('void bootstrapServerCallback()');
      expect(runtimeInitSource).toContain('window.location.origin');
      expect(runtimeInitSource).toContain('window.location.pathname');
      expect(runtimeInitSource).toContain('callbackBootstrapPromise.catch');
      expect(runtimeInitSource).toContain(
        'callbackBootstrapPromise = undefined',
      );
      expect(runtimeInitSource).not.toContain('setServerCallback(');
      expect(runtimeInitSource).not.toContain('RSC_MF_REMOTE_PORT');
      expect(runtimeInitSource).not.toContain('127.0.0.1:');
      expect(runtimeInitSource).not.toContain(
        "from './registerServerCallback'",
      );
      expect(runtimeRegisterSource).toContain('setServerCallback');
      expect(runtimeRegisterSource).toContain('createTemporaryReferenceSet');
      expect(runtimeRegisterSource).toContain(
        'encodeReply(args, { temporaryReferences })',
      );
      expect(runtimeRegisterSource).toContain(
        'createFromFetch(response, { temporaryReferences })',
      );
      expect(runtimeRegisterSource).toContain(
        "from 'rsc-mf-react-server-dom-client-browser'",
      );
      expect(runtimeRegisterSource).not.toContain(
        "from 'react-server-dom-rspack/client.browser'",
      );
      expect(runtimeRegisterSource).not.toContain('127.0.0.1:');
      expect(runtimeRegisterSource).not.toContain('window.location');
      expect(runtimeRegisterSource).toContain("remoteAlias = 'rscRemote'");
      expect(runtimeRegisterSource).toContain(
        "if (rawActionId.startsWith('remote:'))",
      );
      expect(runtimeRegisterSource).toContain(
        'return `remote:${remoteAlias}:${rawActionId}`',
      );
      expect(runtimeRegisterSource).toContain("'x-rsc-action': hostActionId");
      expect(runtimeRegisterSource).toContain("method: 'POST'");
      expect(runtimeRegisterSource).toContain("Accept: 'text/x-component'");
      expect(runtimeRegisterSource).toContain('getNormalizedRemoteActionUrl');
      expect(runtimeRegisterSource).toContain("url.search = ''");
      expect(runtimeRegisterSource).toContain("url.hash = ''");
      expect(runtimeRegisterSource).toContain('remoteActionUrl,');
      expect(runtimeRegisterSource).not.toContain(
        'remoteActionIdToHostProxyActionId',
      );
      expect(moduleFederationConfigSource).toContain(
        'CALLBACK_BOOTSTRAP_IMPORT',
      );
      expect(moduleFederationConfigSource).toContain(
        'CALLBACK_BOOTSTRAP_PREFIX',
      );
      expect(moduleFederationConfigSource).toContain(
        'Callback bootstrap import must stay in runtime namespace',
      );
      expect(moduleFederationConfigSource).toContain(
        'Callback bootstrap import must use explicit source extension',
      );
      expect(moduleFederationConfigSource).toContain(
        'Callback bootstrap import must not contain traversal or Windows separators',
      );
      expect(
        moduleFederationConfigSource.includes(
          '[CALLBACK_BOOTSTRAP_IMPORT, importPath]',
        ),
      ).toBe(true);
      expect(moduleFederationConfigSource).not.toContain(
        'callbackBootstrappedExposes',
      );
      expect(moduleFederationConfigSource).not.toContain(
        'missingCallbackExposeEntries',
      );
      expect(moduleFederationConfigSource).not.toContain(
        './src/runtime/exposes/',
      );
      expect(remoteRuntimeExposeEntries).toEqual([]);
      expect(remoteRuntimeEntriesWithoutExposeDir).toEqual([
        'initServerCallback.ts',
        'registerServerCallback.ts',
      ]);
      expect(moduleFederationConfigSource).toContain('COMPONENT_EXPOSE_PREFIX');
      expect(moduleFederationConfigSource).toContain(
        'nonComponentExposeEntries',
      );
      expect(moduleFederationConfigSource).toContain(
        'nonTypeScriptExposeEntries',
      );
      expect(moduleFederationConfigSource).toContain(
        'parentTraversalExposeEntries',
      );
      expect(moduleFederationConfigSource).toContain('nonPosixExposeEntries');
      expect(moduleFederationConfigSource).toContain('invalidExposeKeys');
      expect(moduleFederationConfigSource).toContain('callbackExposeEntries');
      expect(moduleFederationConfigSource).toContain("shareScope: 'default'");
      expect(moduleFederationConfigSource).toContain("shareScope: 'ssr'");
      expect(moduleFederationConfigSource).toContain("shareScope: 'rsc'");
      expect(moduleFederationConfigSource).toContain('experiments:');
      expect(moduleFederationConfigSource).toContain('asyncStartup: true');
      expect(moduleFederationConfigSource).toContain('rsc: true');
      expect(clientBrowserSharedScopeEntryCount).toBe(3);
      expect(remoteExposeKeys).toEqual(EXPECTED_REMOTE_EXPOSE_PATHS);
      expect(
        remoteExposeEntries.every(({ importPath }) =>
          importPath.startsWith('./src/components/'),
        ),
      ).toBe(true);
      expect(
        remoteExposeEntries.every(({ importPath }) =>
          /\.[tj]sx?$/.test(importPath),
        ),
      ).toBe(true);
      expect(
        remoteExposeEntries.every(
          ({ importPath }) =>
            !importPath.includes('..') && !importPath.includes('\\'),
        ),
      ).toBe(true);
      expect(
        remoteExposeEntries.every(({ importPath }) =>
          fs.existsSync(path.resolve(remoteDir, importPath)),
        ),
      ).toBe(true);
      expect(hostModuleFederationConfigSource).toContain('runtimePlugins');
      expect(hostModuleFederationConfigSource).toContain(
        './runtime/forceRemotePublicPath.ts',
      );
      expect(hostModuleFederationConfigSource).toContain(
        "process.env.NODE_ENV === 'production'",
      );
      expect(hostModuleFederationConfigSource).toContain(': []');
      expect(hostModuleFederationConfigSource).toContain(
        '/static/mf-manifest.json',
      );
      expect(hostModuleFederationConfigSource).toContain('RSC_MF_REMOTE_PORT');
      expect(hostModuleFederationConfigSource).toContain('rscRemote:');
      expect(hostModuleFederationConfigSource).toContain('asyncStartup: true');
      expect(hostModuleFederationConfigSource).toContain('rsc: true');
      expect(hostModuleFederationConfigSource).not.toContain(
        'registerServerCallbackRuntime',
      );
      expect(hostModuleFederationConfigSource).not.toContain(
        'initServerCallback',
      );
      expect(hostModernConfigSource).not.toContain('preEntry');
      expect(hostModernConfigSource).not.toContain('registerServerCallback');
      expect(hostModernConfigSource).toContain('enableAsyncEntry: false');
      expect(hostModernConfigSource).toContain("chain.target('async-node')");
      expect(hostModernConfigSource).toContain("'server-only$'");
      expect(hostModernConfigSource).toContain(
        'moduleFederationPlugin({ ssr: true })',
      );
      expect(remoteModernConfigSource).not.toContain('chunkLoadingGlobal');
      expect(remoteModernConfigSource).toContain(
        'rsc-mf-react-server-dom-client-browser$',
      );
      expect(remoteModernConfigSource).toContain(
        'react-server-dom-rspack/client.browser',
      );
      expect(remoteModernConfigSource).toContain('enableAsyncEntry: false');
      expect(remoteModernConfigSource).toContain("chain.target('async-node')");
      expect(remoteModernConfigSource).toContain('splitChunks(false)');
      expect(remoteModernConfigSource).toContain(
        'moduleFederationPlugin({ ssr: true })',
      );
    });

    it('should not load callback helper expose chunk', () => {
      expect(registerCallbackExposeRequestUrls).toEqual([]);
    });

    it('should support remote use client and server actions', () =>
      supportRemoteClientAndServerActions({
        hostPort,
        page,
        actionRequestIds,
      }));

    it('should route remote actions through host endpoint', () => {
      expect(actionRequestUrls.length).toBe(EXPECTED_ACTION_POSTS_PER_MODE);
      expect(actionRequestUrls.length).toBe(actionRequestIds.length);
      expect(actionRequestUrls.length).toBe(actionRequestAcceptHeaders.length);
      const uniqueActionRequestUrls = Array.from(new Set(actionRequestUrls));
      expect(uniqueActionRequestUrls).toEqual([
        `http://127.0.0.1:${hostPort}${HOST_RSC_URL}`,
      ]);
      expect(
        actionRequestUrls.every(url =>
          url.startsWith(`http://127.0.0.1:${hostPort}${HOST_RSC_URL}`),
        ),
      ).toBe(true);
      expect(
        actionRequestUrls.every(
          url => !url.startsWith(`http://127.0.0.1:${remotePort}`),
        ),
      ).toBe(true);
    });

    it('should post bridge-prefixed action ids for remote actions', async () => {
      expect(actionRequestIds.length).toBe(EXPECTED_ACTION_POSTS_PER_MODE);
      expect(actionRequestIds.length).toBe(actionRequestUrls.length);
      expect(actionRequestIds.length).toBe(actionRequestAcceptHeaders.length);
      const uniqueActionRequestIds = new Set(actionRequestIds);
      expect(
        actionRequestIds.every(id =>
          /^remote:rscRemote:[a-f0-9]{64,}$/i.test(id),
        ),
      ).toBe(true);
      expect(
        actionRequestAcceptHeaders.every(
          acceptHeader => acceptHeader.toLowerCase() === 'text/x-component',
        ),
      ).toBe(true);
      expect(uniqueActionRequestIds.size).toBe(
        EXPECTED_UNIQUE_ACTION_IDS_PER_MODE,
      );
      const actionRequestCountById = new Map<string, number>();
      for (const actionId of actionRequestIds) {
        actionRequestCountById.set(
          actionId,
          (actionRequestCountById.get(actionId) || 0) + 1,
        );
      }
      expect(actionRequestCountById.size).toBe(uniqueActionRequestIds.size);
      expect(
        [...actionRequestCountById.values()].every(
          count => count === EXPECTED_ACTION_POSTS_PER_FAMILY,
        ),
      ).toBe(true);
    });

    it('should have no browser runtime errors', () => {
      expect(runtimeErrors).toEqual([]);
    });
  });
}

runTests({ mode: 'dev' });
runTests({ mode: 'build' });
