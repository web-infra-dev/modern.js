import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';

const projectDir = path.resolve(__dirname, '..');

describe('app-csr-i18n', () => {
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

  test('main-index', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const root = await page.$('#key');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('Hello World');
    await page.click('#zh-button');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const targetTextZh = await page.evaluate(el => el?.textContent, root);
    expect(targetTextZh?.trim()).toEqual('你好，世界');
  });
  test('main-about', async () => {
    await page.goto(`http://localhost:${appPort}/about`, {
      waitUntil: ['networkidle0'],
    });
    const rootAbout = await page.$('#about');
    const targetTextAbout = await page.evaluate(
      el => el?.textContent,
      rootAbout,
    );
    expect(targetTextAbout?.trim()).toEqual('About');
    await page.click('#zh-button');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const targetTextAboutZh = await page.evaluate(
      el => el?.textContent,
      rootAbout,
    );
    expect(targetTextAboutZh?.trim()).toEqual('关于');
  });
  test('lang-redirect-to-en', async () => {
    await page.goto(`http://localhost:${appPort}/lang`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/lang/en`);
    await page.goto(`http://localhost:${appPort}/lang/`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/lang/en`);
    await page.goto(`http://localhost:${appPort}/lang/about`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/lang/en/about`);
    await page.goto(`http://localhost:${appPort}/lang/about/`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/lang/en/about`);
  });
  test('lang-zh', async () => {
    await page.goto(`http://localhost:${appPort}/lang/zh`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$('#key');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('你好，世界');
    await page.goto(`http://localhost:${appPort}/lang/zh/about`, {
      waitUntil: ['networkidle0'],
    });
    const about = await page.$('#about');
    const targetTextAbout = await page.evaluate(el => el?.textContent, about);
    expect(targetTextAbout?.trim()).toEqual('关于');
  });
  test('lang-en', async () => {
    await page.goto(`http://localhost:${appPort}/lang/en`, {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$('#key');
    const targetText = await page.evaluate(el => el?.textContent, text);
    expect(targetText?.trim()).toEqual('Hello World');
    await page.goto(`http://localhost:${appPort}/lang/en/about`, {
      waitUntil: ['networkidle0'],
    });
    const about = await page.$('#about');
    const targetTextAbout = await page.evaluate(el => el?.textContent, about);
    expect(targetTextAbout?.trim()).toEqual('About');
  });
});
