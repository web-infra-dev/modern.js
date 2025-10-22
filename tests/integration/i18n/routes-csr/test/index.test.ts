import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';

const projectDir = path.resolve(__dirname, '..');

describe('router-csr-i18n', () => {
  let app: unknown;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  beforeAll(async () => {
    const appDir = projectDir;
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });
  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('redirect-to-en', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en`);
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en`);
    await page.goto(`http://localhost:${appPort}/about`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en/about`);
    await page.goto(`http://localhost:${appPort}/about/`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en/about`);
  });
  test('page-zh', async () => {
    await page.goto(`http://localhost:${appPort}/zh`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$('#key');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('你好，世界');
  });
  test('page-en', async () => {
    await page.goto(`http://localhost:${appPort}/en`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$('#key');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('Hello World');
  });
  test('page-zh-about', async () => {
    await page.goto(`http://localhost:${appPort}/zh/about`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$('#about');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('关于');
    await page.click('#en-button');
    await new Promise(resolve => setTimeout(resolve, 5000));
    const textEn = await page.$('#about');
    const targetTextEn = await page.evaluate(el => el?.textContent, textEn);
    expect(targetTextEn?.trim()).toEqual('About');
  });
  test('page-en-about', async () => {
    await page.goto(`http://localhost:${appPort}/en/about`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$('#about');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('About');
    await page.click('#zh-button');
    await new Promise(resolve => setTimeout(resolve, 5000));
    const textZh = await page.$('#about');
    const targetTextZh = await page.evaluate(el => el?.textContent, textZh);
    expect(targetTextZh?.trim()).toEqual('关于');
  });
});
