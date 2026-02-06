import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

async function waitForAppReady(url: string, maxRetries = 60) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok || res.status < 500) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`App did not become ready: ${url}`);
}

const remoteDir = path.resolve(__dirname, '../mf-remote');
const hostDir = path.resolve(__dirname, '../mf-host');

const REMOTE_PORT = 3010;
const HOST_PORT = 3011;

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html',
    },
  });
  return {
    status: res.status,
    html: await res.text(),
  };
}

describe('routes-tanstack-mf', () => {
  let remoteApp: unknown;
  let hostApp: unknown;
  let browser: Browser;
  let page: Page;
  const errors: string[] = [];

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 5);

    remoteApp = await launchApp(remoteDir, REMOTE_PORT);
    await waitForAppReady(`http://localhost:${REMOTE_PORT}/mf-manifest.json`);

    hostApp = await launchApp(hostDir, HOST_PORT);
    await waitForAppReady(`http://localhost:${HOST_PORT}/`);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
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

  test('keeps client-render boundary explicit for federated route content', async () => {
    const { status, html } = await fetchHtml(`http://localhost:${HOST_PORT}/mf`);
    expect(status).toBe(200);
    expect(html).toContain('<!--<?- html ?>-->');
    expect(html).not.toContain('host-mf-loader');
    expect(html).not.toContain('host-mf-count:');
    expect(html).not.toContain('remote-widget:ok');
    expect(html).not.toContain('id="remote-mutator"');
  });

  test('supports remote component fetcher with host loader/action', async () => {
    await page.goto(`http://localhost:${HOST_PORT}/mf`, {
      waitUntil: ['networkidle0'],
      timeout: 50000,
    });

    await page.waitForSelector('#remote-widget', { timeout: 50000 });
    const remoteText = await page.$eval('#remote-widget', el => el.textContent);
    expect(remoteText).toContain('remote-widget:ok');

    await page.waitForSelector('#remote-mutator', { timeout: 50000 });
    const hostLoaderText = await page.$eval('#host-loader', el => el.textContent);
    expect(hostLoaderText).toBe('host-mf-loader');

    const getHostCount = async () => {
      const text = await page.$eval('#host-mf-count', el => el.textContent || '');
      return Number(text.replace('host-mf-count:', ''));
    };

    const initialCount = await getHostCount();

    await page.click('[data-testid="remote-fetcher-submit"]');
    await page.waitForFunction(
      expected =>
        document.querySelector('#host-mf-count')?.textContent ===
        `host-mf-count:${expected}`,
      {},
      initialCount + 2,
    );

    await page.click('[data-testid="remote-fetcher-load"]');
    await page.waitForFunction(
      expected =>
        document.querySelector('#remote-fetcher-data')?.textContent ===
        `remote-fetcher:${expected}`,
      {},
      initialCount + 2,
    );
    expect(page.url()).toBe(`http://localhost:${HOST_PORT}/mf`);

    const remoteFetcherState = await page.$eval(
      '#remote-fetcher-state',
      el => el.textContent,
    );
    expect(remoteFetcherState).toBe('idle');
    expect(errors).toEqual([]);
  });
});
