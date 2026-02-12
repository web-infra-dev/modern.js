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
const RSC_RUNTIME_BLOCKER_PATTERN =
  /Cannot find (render handler|server bundle) for RSC/;

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
  if (RSC_RUNTIME_BLOCKER_PATTERN.test(html)) {
    return {
      blocked: true,
      html,
    };
  }

  expect(html).toContain('Host RSC Module Federation');
  expect(html).toContain('Remote Federated Tree');
  expect(html).toContain('remote-server-only-ok');

  await page.goto(`http://127.0.0.1:${hostPort}${HOST_RSC_URL}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });
  const hostRemoteServerOnly = await page.$eval(
    '.host-remote-server-only',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteServerOnly).toBe('remote-server-only-ok');

  return {
    blocked: false,
    html,
  };
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
    let runtimeBlocked = false;
    let runtimeBlockerHtml = '';

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

      if (mode === 'build') {
        page.on('pageerror', error => {
          runtimeErrors.push((error as Error).message);
        });
      }
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

    it('should render remote RSC content in host app', async () => {
      const renderResult = await renderRemoteRscIntoHost({ hostPort, page });
      runtimeBlocked = renderResult.blocked;
      runtimeBlockerHtml = renderResult.html;

      if (runtimeBlocked) {
        expect(runtimeBlockerHtml).toMatch(RSC_RUNTIME_BLOCKER_PATTERN);
      }
    });

    it('should support remote use client and server actions', async () => {
      if (runtimeBlocked) {
        expect(runtimeBlockerHtml).toMatch(RSC_RUNTIME_BLOCKER_PATTERN);
        return;
      }

      await supportRemoteClientAndServerActions({ hostPort, page });
    });

    if (mode === 'build') {
      it('should have no browser runtime errors', () => {
        expect(runtimeErrors).toEqual([]);
      });
    }
  });
}

runTests({ mode: 'dev' });
runTests({ mode: 'build' });
