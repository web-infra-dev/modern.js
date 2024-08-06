import dns from 'node:dns';
import path, { join } from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import axios from 'axios';
import {
  launchApp,
  getPort,
  launchOptions,
  killApp,
} from '../../../utils/modernTestUtils';

dns.setDefaultResultOrder('ipv4first');
const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('test partial ssr', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'partial');
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

  test('should render / with CSR', async () => {
    const res = await axios.get(`http://localhost:${appPort}/one`);
    const content = res.data;
    expect(content).not.toContain('root layout');

    await page.goto(`http://localhost:${appPort}/one`);
    await page.waitForSelector('#root_layout');
    const pageContent = await page.content();
    expect(pageContent).toContain('root layout');
  });

  test('should render /a with CSR', async () => {
    const res = await axios.get(`http://localhost:${appPort}/one/a`);
    const content = res.data;
    expect(content).not.toContain('root layout');

    await page.goto(`http://localhost:${appPort}/one/a`);
    await page.waitForSelector('#root_layout');
    await page.waitForSelector('.page-a');
    const pageContent = await page.content();
    expect(pageContent).toContain('root layout');
    expect(pageContent).toContain('PageA Data');
  });

  test('should render /b with SSR', async () => {
    const res = await axios.get(`http://localhost:${appPort}/one/b`);
    const content = res.data;
    expect(content).toContain('root layout');

    await page.goto(`http://localhost:${appPort}/one/b`);
    await page.waitForSelector('#root_layout');
    await page.waitForSelector('.page-b');

    const pageContent = await page.content();
    expect(pageContent).toContain('root layout');
    expect(pageContent).toContain('PageB Data');
  });

  // This test case ensures that the data loader for b is executed on the server side
  test('should navigate to /b correctly', async () => {
    await page.goto(`http://localhost:${appPort}/one/a`, {
      waitUntil: ['networkidle0'],
    });
    await Promise.all([page.click('.b-btn'), page.waitForSelector('.page-b')]);
    const pageBElm = await page.$('.page-b');
    const text = await page.evaluate(el => el?.textContent, pageBElm);
    expect(text).toContain('PageB Data');
  });

  test('should render nested route with CSR', async () => {
    const res = await axios.get(`http://localhost:${appPort}/one/b/d`);
    const content = res.data;
    expect(content).not.toContain('root layout');

    await page.goto(`http://localhost:${appPort}/one/b/d`);
    await page.waitForSelector('#root_layout');
    await page.waitForSelector('.page-d');

    const pageContent = await page.content();
    expect(pageContent).toContain('root layout');

    expect(pageContent).toContain('PageD Data');
  });
});
