import { randomUUID } from 'node:crypto';
import dns from 'node:dns';
import { get } from 'node:http';
import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import axios from 'axios';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';
import { expectPageToMatchTextContent } from '../../../utils/rstestPuppeteer';

dns.setDefaultResultOrder('ipv4first');
const fixtureDir = path.resolve(__dirname, '../fixtures');

async function basicUsage(page: Page, appPort: number) {
  await page.goto(`http://localhost:${appPort}/user/1`, {
    waitUntil: ['networkidle0'],
  });
  await expectPageToMatchTextContent(page, 'user1-18');

  const content = await page.content();
  await (expect(content) as any).toMatch('"headers":{"host":');
}

async function errorThrown(page: Page, appPort: number) {
  await page.goto(`http://localhost:${appPort}/error`, {
    waitUntil: ['networkidle0'],
    timeout: 50000,
  });

  await expectPageToMatchTextContent(page, /error occurs/);
}

async function errorThrownInClientNavigation(page: Page, appPort: number) {
  await page.goto(`http://localhost:${appPort}`, {
    waitUntil: ['networkidle0'],
  });

  await page.click('#error-btn');
  await page.waitForSelector('.error');
  const element = await page.$('.error');
  const elementContent = await page.evaluate(el => el?.textContent, element);
  expect(elementContent).toMatchSnapshot();
}

async function redirectInLoader(page: Page, appPort: number) {
  const res = await page.goto(`http://localhost:${appPort}/redirect`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res!.text();
  expect(body).toMatch(/Root layout/);
  expect(body).not.toMatch(/Redirect page/);
}

async function checkIsPassChunkLoadingGlobal() {
  const modernJsDir = join(fixtureDir, 'base', 'node_modules', '.modern-js');
  const entryFilePath = join(modernJsDir, 'index', 'index.jsx');
  const content = await fs.readFile(entryFilePath, 'utf-8');
  expect(content).toMatch(/chunkLoadingGlobal/);
}

describe('Traditional SSR', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  let serverOutput = '';

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'base');
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {
      onStdout: (message: string) => {
        serverOutput += message;
      },
    });

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test(`basic usage`, async () => {
    await basicUsage(page, appPort);
  });

  test.each(['GET', 'POST'])(
    '%s SSR preserves loader headers and GET method',
    async method => {
      const response = await fetch(
        `http://localhost:${appPort}/abort?no-cache=1`,
        { method, headers: { 'x-loader-test': 'preserved' } },
      );
      expect(response.status).toBe(200);
      expect(await response.text()).toContain(
        'loader-result:GET:preserved:false',
      );
    },
  );

  test('aborts the loader signal when the SSR client disconnects', async () => {
    const id = randomUUID();
    const request = get(
      `http://localhost:${appPort}/abort?no-cache=1&id=${id}`,
      response => response.resume(),
    );
    const closed = new Promise<void>(resolve => request.once('close', resolve));
    // Destroying an unfinished HTTP request emits ECONNRESET.
    const errors: Error[] = [];
    request.on('error', error => errors.push(error));

    try {
      await expect
        .poll(() => serverOutput, { timeout: 5000 })
        .toContain(`loader-started:${id}:false`);
      request.destroy();
      await closed;
      await expect
        .poll(() => serverOutput, { timeout: 5000 })
        .toContain(`loader-aborted:${id}:true`);
      expect(
        errors.every(error => 'code' in error && error.code === 'ECONNRESET'),
      ).toBe(true);
    } finally {
      request.destroy();
      await closed;
    }
  });

  // We will not add chunkLoadingGlobal to entry(index.jsx)
  test.skip(`should pass chunkLoadingGlobal`, async () => {
    await checkIsPassChunkLoadingGlobal();
  });

  test.skip(`client navigation works`, async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    await page.click('#user-btn');
    await expectPageToMatchTextContent(page, 'user1-18');
  });

  test('error thrown in loader', async () => {
    await errorThrown(page, appPort);
  });

  test('error thrown in client navigation', async () => {
    await errorThrownInClientNavigation(page, appPort);
  });

  test('redirect in loader', async () => {
    await redirectInLoader(page, appPort);
  });

  test('ssr cache on 5000ms', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const content = await page.content();
    const result = content.match(/count:(\d+)/)![0];

    // twice visit, because the cache, the count still same.
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const content1 = await page.content();
    expect(content1).toMatch(result);

    await page.goto(`http://localhost:${appPort}/?no-cache=1`);
    const content2 = await page.content();
    expect(content2).not.toMatch(result);
  });

  test('x-render-cache http header', async () => {
    const response = await axios.get(`http://localhost:${appPort}`);

    const { headers } = response;
    expect(Boolean(headers['x-render-cache'])).toBeTruthy();
  });

  test('no ssr cache', async () => {
    await page.goto(`http://localhost:${appPort}/no-ssr-cache`, {
      waitUntil: ['networkidle0'],
    });
    const content = await page.content();
    const result = content.match(/count:(\d+)/)![0];

    // twice visit, because the no-ssr-cache, the count is different.
    await page.goto(`http://localhost:${appPort}/no-ssr-cache`, {
      waitUntil: ['networkidle0'],
    });
    const content1 = await page.content();
    expect(content1).not.toMatch(result);
  });
});
