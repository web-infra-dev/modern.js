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
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../');
const hostDir = path.resolve(fixtureDir, 'host');
const remoteDir = path.resolve(fixtureDir, 'remote');

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

async function waitForAppReady(port: number, maxRetries = 60) {
  for (let index = 0; index < maxRetries; index++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok || response.status < 500) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
      }
    } catch (error) {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`App on port ${port} did not become ready`);
}

async function renderRemoteRscIntoHost({ hostPort, page }: TestContext) {
  const response = await fetch(`http://127.0.0.1:${hostPort}`);
  const html = await response.text();
  expect(html).toContain('Host RSC Module Federation');
  expect(html).toContain('Remote Federated Tree');
  expect(html).toContain('remote-server-only-ok');

  await page.goto(`http://127.0.0.1:${hostPort}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });
  const hostRemoteServerOnly = await page.$eval(
    '.host-remote-server-only',
    el => el.textContent?.trim(),
  );
  expect(hostRemoteServerOnly).toBe('remote-server-only-ok');
}

async function supportRemoteClientAndServerActions({
  hostPort,
  page,
}: TestContext) {
  await page.goto(`http://127.0.0.1:${hostPort}`, {
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
        await waitForAppReady(remotePort);

        hostApp = await launchApp(hostDir, hostPort, {}, hostEnv);
        await waitForAppReady(hostPort);
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
        await waitForAppReady(remotePort);

        hostApp = await modernServe(hostDir, hostPort, {
          env: {
            PORT: String(hostPort),
            NODE_ENV: 'production',
            ...hostEnv,
          },
        });
        await waitForAppReady(hostPort);
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
