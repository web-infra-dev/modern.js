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
    await new Promise(resolve => setTimeout(resolve, 3000));

    const getErrorText = await page.$eval(
      '.hello:nth-child(1) pre',
      el => el?.textContent,
    );

    expect(getErrorText).toContain('"status": 500');
    expect(getErrorText).toContain('"message"');
  });

  test('should display correct error information for exception API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const exceptionErrorText = await page.$eval(
      '.hello:nth-child(2) pre',
      el => el?.textContent,
    );

    expect(exceptionErrorText).toContain('"status": 401');
    expect(exceptionErrorText).toContain('"message"');
  });

  test('should display correct error information for getManaged API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const getManagedErrorText = await page.$eval(
      '.hello:nth-child(3) pre',
      el => el?.textContent,
    );

    expect(getManagedErrorText).toContain('"status": 501');
    expect(getManagedErrorText).toContain('"error"');
  });

  test('should display correct error information for exceptionManaged API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const exceptionManagedErrorText = await page.$eval(
      '.hello:nth-child(4) pre',
      el => el?.textContent,
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
    await new Promise(resolve => setTimeout(resolve, 3000));

    const getErrorText = await page.$eval(
      '.hello:nth-child(1) pre',
      el => el?.textContent,
    );

    expect(getErrorText).toContain('"status": 500');
    expect(getErrorText).toContain('"message"');
  });

  test('should display correct error information for exception API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const exceptionErrorText = await page.$eval(
      '.hello:nth-child(2) pre',
      el => el?.textContent,
    );

    expect(exceptionErrorText).toContain('"status": 401');
    expect(exceptionErrorText).toContain('"message"');
  });

  test('should display correct error information for getManaged API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const getManagedErrorText = await page.$eval(
      '.hello:nth-child(3) pre',
      el => el?.textContent,
    );

    expect(getManagedErrorText).toContain('"status": 501');
    expect(getManagedErrorText).toContain('"error"');
  });

  test('should display correct error information for exceptionManaged API', async () => {
    await page.goto(`${host}:${port}/${ERROR_PAGE}`, {
      timeout: 50000,
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const exceptionManagedErrorText = await page.$eval(
      '.hello:nth-child(4) pre',
      el => el?.textContent,
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
