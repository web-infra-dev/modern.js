import dns from 'node:dns';
import path from 'path';
import axios from 'axios';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

dns.setDefaultResultOrder('ipv4first');

describe('app-server', () => {
  let app: unknown;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  beforeAll(async () => {
    const appDir = path.join(fixtures, 'app-server-entry');
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

  test('main', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const root = await page.$('#text');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('Index');
  });
  test('about', async () => {
    await page.goto(`http://localhost:${appPort}/about`, {
      waitUntil: ['networkidle0'],
    });
    const root = await page.$('#text');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('About');
  });
  test('main ssr', async () => {
    // Add retry mechanism for Linux environment
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await axios.get(`http://localhost:${appPort}`, {
          timeout: 10000,
        });
        break;
      } catch (error: any) {
        if (error.response?.status === 403 && retries > 1) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw error;
      }
    }

    const body = response.data;
    expect(body).toMatch(/Index/);
  });
  test('about ssr', async () => {
    // Add retry mechanism for Linux environment
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await axios.get(`http://localhost:${appPort}/about`, {
          timeout: 10000,
        });
        break;
      } catch (error: any) {
        if (error.response?.status === 403 && retries > 1) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw error;
      }
    }

    const body = response.data;
    expect(body).toMatch(/About/);
  });
});
