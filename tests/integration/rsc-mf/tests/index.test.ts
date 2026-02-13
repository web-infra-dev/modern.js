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

type Mode = 'dev' | 'build';

interface TestConfig {
  mode: Mode;
}

interface TestContext {
  hostPort: number;
  page: Page;
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
  const hostRemoteAsyncServerInfo = await page.$eval(
    '.remote-async-server-info',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteAsyncServerInfo).toBe('remote-async-server-info-ok');
}

async function supportRemoteClientAndServerActions({
  hostPort,
  page,
}: TestContext) {
  await page.goto(`http://127.0.0.1:${hostPort}${HOST_RSC_URL}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });
  await page.waitForSelector('.remote-client-local-increment');

  let localCount = await page.$eval('.remote-client-local-count', el =>
    el.textContent?.trim(),
  );
  let serverCount = await page.$eval('.remote-client-server-count', el =>
    el.textContent?.trim(),
  );
  expect(localCount).toBe('0');
  expect(serverCount).toBe('0');

  await page.click('.remote-client-local-increment');
  localCount = await page.$eval('.remote-client-local-count', el =>
    el.textContent?.trim(),
  );
  expect(localCount).toBe('1');

  await page.click('.remote-client-server-increment');
  await page.waitForFunction(
    () =>
      !document
        .querySelector('.remote-client-server-increment')
        ?.hasAttribute('disabled'),
  );
  serverCount = await page.$eval('.remote-client-server-count', el =>
    el.textContent?.trim(),
  );
  expect(serverCount).toBe('1');

  await page.click('.remote-client-run-actions');
  await page.waitForFunction(() => {
    const nested = document.querySelector('.remote-client-nested-result');
    const remoteAction = document.querySelector(
      '.remote-client-remote-action-result',
    );
    return (
      nested?.textContent?.trim() === 'nested-action:from-client' &&
      remoteAction?.textContent?.trim() === 'remote-action:from-client'
    );
  });

  let badgeValue = await page.$eval('.remote-client-badge-value', el =>
    el.textContent?.trim(),
  );
  expect(badgeValue).toBe('remote-client-badge-initial');
  await page.click('.remote-client-badge-toggle');
  badgeValue = await page.$eval('.remote-client-badge-value', el =>
    el.textContent?.trim(),
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
    return (
      defaultActionResult?.textContent?.trim() ===
        'default-action:from-host-client' &&
      echoActionResult?.textContent?.trim() === 'remote-action:from-host-client'
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
        // Debugging aid for flaky integration failures.
        console.log(`[pageerror:${mode}] ${message}`);
        if (err.stack) {
          console.log(`[pageerror:${mode}:stack] ${err.stack}`);
        }
      });
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('[rsc-mf]')) {
          const location = msg.location();
          const suffix = location?.url
            ? ` @ ${location.url}:${location.lineNumber}:${location.columnNumber}`
            : '';
          console.log(`[browser:${mode}] ${msg.text()}${suffix}`);
        }
      });
      page.on('response', async response => {
        if (response.status() >= 400 && response.url().includes(HOST_RSC_URL)) {
          console.log(
            `[response:${mode}] ${response.status()} ${response.url()}`,
          );
          const body = await response.text().catch(() => '');
          if (body) {
            console.log(`[response:${mode}:body] ${body}`);
          }
        }
      });
      page.on('request', request => {
        if (
          request.method() === 'POST' &&
          request.url().includes(HOST_RSC_URL)
        ) {
          const actionId = request.headers()['x-rsc-action'];
          console.log(`[request:${mode}] action=${actionId || 'missing'}`);
        }
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

    it('should support remote use client and server actions', () =>
      supportRemoteClientAndServerActions({ hostPort, page }));

    if (mode === 'build') {
      it('should have no browser runtime errors', () => {
        expect(runtimeErrors).toEqual([]);
      });
    }
  });
}

runTests({ mode: 'dev' });
runTests({ mode: 'build' });
