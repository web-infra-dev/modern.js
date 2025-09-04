import dns from 'node:dns';
import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';
import 'isomorphic-fetch';

dns.setDefaultResultOrder('ipv4first');

const appDir = path.resolve(__dirname, '../');
const host = 'http://localhost';
const ERROR_PAGE = 'error';

describe('error handling in dev', () => {
  let port = 8080;
  let app: any;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    port = await getPort();
    app = await launchApp(appDir, port, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  test('should display correct error information for get API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.get pre');
        return el?.textContent !== 'null';
      },
      { timeout: 10000 },
    );

    const getErrorText = await page.$eval(
      '.get pre',
      (el?: Element) => el?.textContent,
    );

    expect(getErrorText).toContain('"status": 500');
    expect(getErrorText).toContain('"message"');
  });

  test('should display correct error information for exception API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.exception pre');
        return el?.textContent !== 'null';
      },
      { timeout: 10000 },
    );

    const exceptionErrorText = await page.$eval(
      '.exception pre',
      (el?: Element) => el?.textContent,
    );

    expect(exceptionErrorText).toContain('"status": 401');
    expect(exceptionErrorText).toContain('"message"');
  });

  test('should display correct error information for getManaged API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.getManaged pre');
        return el?.textContent !== 'null';
      },
      { timeout: 10000 },
    );

    const getManagedErrorText = await page.$eval(
      '.getManaged pre',
      (el?: Element) => el?.textContent,
    );

    expect(getManagedErrorText).toContain('"status": 501');
    expect(getManagedErrorText).toContain('"error"');
  });

  test('should display correct error information for exceptionManaged API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.exceptionManaged pre');
        return el?.textContent !== 'null';
      },
      { timeout: 10000 },
    );

    const exceptionManagedErrorText = await page.$eval(
      '.exceptionManaged pre',
      (el?: Element) => el?.textContent,
    );

    expect(exceptionManagedErrorText).toContain('"status": 501');
    expect(exceptionManagedErrorText).toContain('"error"');
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('error handling in prod', () => {
  let port = 8080;
  let app: any;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    port = await getPort();
    await modernBuild(appDir, [], {});
    app = await modernServe(appDir, port, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  test('should display correct error information for get API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.get pre');
        return el?.textContent !== 'null';
      },
      { timeout: 10000 },
    );

    const getErrorText = await page.$eval(
      '.get pre',
      (el?: Element) => el?.textContent,
    );

    expect(getErrorText).toContain('"status": 500');
    expect(getErrorText).toContain('"message"');
  });

  test('should display correct error information for exception API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.exception pre');
        return el?.textContent !== 'null';
      },
      { timeout: 10000 },
    );

    const exceptionErrorText = await page.$eval(
      '.exception pre',
      (el?: Element) => el?.textContent,
    );

    expect(exceptionErrorText).toContain('"status": 401');
    expect(exceptionErrorText).toContain('"message"');
  });

  test('should display correct error information for getManaged API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.getManaged pre');
        return el?.textContent !== 'null';
      },
      { timeout: 10000 },
    );

    const getManagedErrorText = await page.$eval(
      '.getManaged pre',
      (el?: Element) => el?.textContent,
    );

    expect(getManagedErrorText).toContain('"status": 501');
    expect(getManagedErrorText).toContain('"error"');
  });

  test('should display correct error information for exceptionManaged API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.exceptionManaged pre');
        return el?.textContent !== 'null';
      },
      { timeout: 10000 },
    );

    const exceptionManagedErrorText = await page.$eval(
      '.exceptionManaged pre',
      (el?: Element) => el?.textContent,
    );

    expect(exceptionManagedErrorText).toContain('"status": 501');
    expect(exceptionManagedErrorText).toContain('"error"');
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
