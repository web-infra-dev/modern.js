import path from 'path';
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

const appDir = path.resolve(__dirname, '../');

describe('dev', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(
      appDir,
      appPort,
      {},
      {
        BUNDLER: 'webpack',
      },
    );
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  describe('csr and rsc', () => {
    const baseUrl = `/`;
    it('should render page correctly', () =>
      renderServerRootPageCorrectly({ baseUrl, appPort, page }));
    it('should support client and server actions', () =>
      supportServerAction({ baseUrl, appPort, page }));
  });
});

describe('build', () => {
  let appPort: number;
  let app: unknown;
  let page: Page;
  let browser: Browser;
  const errors: string[] = [];
  beforeAll(async () => {
    appPort = await getPort();
    await modernBuild(appDir, [], {
      env: {
        BUNDLER: 'webpack',
      },
    });
    app = await modernServe(appDir, appPort, {
      cwd: appDir,
    });
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  describe('csr and rsc', () => {
    const baseUrl = `/`;
    it('should render page correctly', () =>
      renderServerRootPageCorrectly({ baseUrl, appPort, page }));
    it('should support server action', () =>
      supportServerAction({ baseUrl, appPort, page }));
  });
});

interface TestOptions {
  baseUrl: string;
  appPort: number;
  page: Page;
}

async function renderServerRootPageCorrectly({
  baseUrl,
  appPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${appPort}/${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  const clientStateExists = await page.$eval('body', el =>
    el.textContent?.includes('Client State'),
  );
  const serverStateExists = await page.$eval('body', el =>
    el.textContent?.includes('Server State'),
  );
  const dynamicMessageExists = await page.$eval('body', el =>
    el.textContent?.includes('Dynamic Message'),
  );
  const countStateExists = await page.$eval('body', el =>
    el.textContent?.includes('countStateFromServer'),
  );

  expect(clientStateExists).toBe(true);
  expect(serverStateExists).toBe(true);
  expect(dynamicMessageExists).toBe(true);
  expect(countStateExists).toBe(true);
}

async function supportServerAction({ baseUrl, appPort, page }: TestOptions) {
  await page.goto(`http://localhost:${appPort}/${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  let clientCount = await page.$eval('.client-count', el => el.textContent);
  let serverCount = await page.$eval('.server-count', el => el.textContent);
  expect(clientCount).toBe('0');
  expect(serverCount).toBe('0');

  await page.click('.client-increment');
  clientCount = await page.$eval('.client-count', el => el.textContent);
  expect(clientCount).toBe('1');

  await page.click('.server-increment');
  await page.waitForFunction(
    () =>
      !document.querySelector('.server-increment')?.hasAttribute('disabled'),
  );
  serverCount = await page.$eval('.server-count', el => el.textContent);
  expect(serverCount).toBe('1');
}
