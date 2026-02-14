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
  expect(html).toContain('host-remote-bundled-server-only');
  expect(html).toContain('host-remote-bundled-meta-kind');
  expect(html).toContain('host-proxy-action-id-count');
  expect(html).toContain('host-proxy-map-entry-count');
  expect(html).toContain('host-mapped-proxy-action-ids');
  expect(html).toContain('host-proxy-map-covers-all');
  expect(html).toContain('host-proxy-action-ids');
  expect(html).toContain('host-direct-proxy-action-ids');
  expect(html).toContain('host-bundled-proxy-action-ids');

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
  const hostProxyActionIdCount = await page.$eval(
    '.host-proxy-action-id-count',
    el => el.textContent?.trim(),
  );
  expect(hostProxyActionIdCount).toBe('8');
  const hostProxyMapEntryCount = await page.$eval(
    '.host-proxy-map-entry-count',
    el => el.textContent?.trim(),
  );
  expect(hostProxyMapEntryCount).toBe('8');
  const hostMappedProxyActionIds = await page.$eval(
    '.host-mapped-proxy-action-ids',
    el => el.textContent?.trim(),
  );
  const hostMappedProxyActionIdList = hostMappedProxyActionIds
    ?.split(',')
    .filter(Boolean) as string[];
  expect(hostMappedProxyActionIdList.length).toBe(8);
  expect(hostMappedProxyActionIdList.length).toBe(
    Number(hostProxyMapEntryCount),
  );
  const hostProxyMapCoversAll = await page.$eval(
    '.host-proxy-map-covers-all',
    el => el.textContent?.trim(),
  );
  expect(hostProxyMapCoversAll).toBe('true');
  const hostProxyActionIds = await page.$eval('.host-proxy-action-ids', el =>
    el.textContent?.trim(),
  );
  const hostProxyActionIdList = hostProxyActionIds
    ?.split(',')
    .filter(Boolean) as string[];
  expect(hostProxyActionIdList.length).toBe(8);
  expect(hostProxyActionIdList.length).toBe(Number(hostProxyMapEntryCount));
  expect(new Set(hostProxyActionIdList).size).toBe(8);
  expect(hostProxyActionIdList.every(id => /^[a-f0-9]{64,}$/i.test(id))).toBe(
    true,
  );
  const sortedHostProxyActionIds = [...hostProxyActionIdList].sort();
  const sortedMappedProxyActionIds = [...hostMappedProxyActionIdList].sort();
  expect(
    sortedHostProxyActionIds.every(
      (id, index) => id === sortedMappedProxyActionIds[index],
    ),
  ).toBe(true);
  const hostDirectProxyActionIds = await page.$eval(
    '.host-direct-proxy-action-ids',
    el => el.textContent?.trim(),
  );
  const hostDirectProxyActionIdList = hostDirectProxyActionIds
    ?.split(',')
    .filter(Boolean) as string[];
  expect(hostDirectProxyActionIdList.length).toBe(4);
  const hostBundledProxyActionIds = await page.$eval(
    '.host-bundled-proxy-action-ids',
    el => el.textContent?.trim(),
  );
  const hostBundledProxyActionIdList = hostBundledProxyActionIds
    ?.split(',')
    .filter(Boolean) as string[];
  expect(hostBundledProxyActionIdList.length).toBe(4);
  const groupedProxyActionIdUnion = new Set([
    ...hostDirectProxyActionIdList,
    ...hostBundledProxyActionIdList,
  ]);
  expect(groupedProxyActionIdUnion.size).toBe(hostProxyActionIdList.length);
  expect(
    hostProxyActionIdList.every(actionId =>
      groupedProxyActionIdUnion.has(actionId),
    ),
  ).toBe(true);
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

  await page.click('.host-remote-action-runner .remote-client-run-actions');
  await page.waitForFunction(() => {
    const nested = document.querySelector(
      '.host-remote-action-runner .remote-client-nested-result',
    );
    const remoteAction = document.querySelector(
      '.host-remote-action-runner .remote-client-remote-action-result',
    );
    return (
      nested?.textContent?.trim() === 'nested-action:from-client' &&
      remoteAction?.textContent?.trim() === 'remote-action:from-client'
    );
  });

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
      bundledDefaultActionResult?.textContent?.trim() ===
        'default-action:from-host-client-bundled' &&
      bundledEchoActionResult?.textContent?.trim() ===
        'remote-action:from-host-client-bundled' &&
      bundledNestedActionResult?.textContent?.trim() ===
        'nested-action:from-host-client-bundled' &&
      bundledIncrementActionResult?.textContent?.trim() === '2'
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
        if (request.method() !== 'POST' || !headers['x-rsc-action']) {
          return;
        }
        actionRequestUrls.push(request.url());
        actionRequestIds.push(headers['x-rsc-action']);
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

    it('should route remote actions through host endpoint', () => {
      expect(actionRequestUrls.length).toBeGreaterThan(0);
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

    it('should post host-resolvable action ids for remote actions', async () => {
      expect(actionRequestIds.length).toBeGreaterThan(0);
      expect(actionRequestIds.every(id => !id.startsWith('remote:'))).toBe(
        true,
      );
      expect(actionRequestIds.every(id => /^[a-f0-9]{64,}$/i.test(id))).toBe(
        true,
      );
      expect(new Set(actionRequestIds).size).toBeGreaterThanOrEqual(4);
      const hostProxyActionIdSet = new Set(
        (await page.$eval('.host-proxy-action-ids', el => el.textContent || ''))
          .split(',')
          .filter(Boolean),
      );
      expect(actionRequestIds.every(id => hostProxyActionIdSet.has(id))).toBe(
        true,
      );
      const mappedProxyActionIdSet = new Set(
        (
          await page.$eval(
            '.host-mapped-proxy-action-ids',
            el => el.textContent || '',
          )
        )
          .split(',')
          .filter(Boolean),
      );
      expect(actionRequestIds.every(id => mappedProxyActionIdSet.has(id))).toBe(
        true,
      );
      const directProxyActionIdSet = new Set(
        (
          await page.$eval(
            '.host-direct-proxy-action-ids',
            el => el.textContent || '',
          )
        )
          .split(',')
          .filter(Boolean),
      );
      const bundledProxyActionIdSet = new Set(
        (
          await page.$eval(
            '.host-bundled-proxy-action-ids',
            el => el.textContent || '',
          )
        )
          .split(',')
          .filter(Boolean),
      );
      const usesDirectProxyIds = actionRequestIds.some(id =>
        directProxyActionIdSet.has(id),
      );
      const usesBundledProxyIds = actionRequestIds.some(id =>
        bundledProxyActionIdSet.has(id),
      );
      expect(usesDirectProxyIds || usesBundledProxyIds).toBe(true);
      expect(
        actionRequestIds.every(
          id =>
            directProxyActionIdSet.has(id) || bundledProxyActionIdSet.has(id),
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
