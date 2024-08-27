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
import { isVersionAtLeast1819 } from '@modern-js/utils';

const appDir = path.resolve(__dirname, '../');
dns.setDefaultResultOrder('ipv4first');

if (isVersionAtLeast1819()) {
  describe('pure-esm-project in dev', () => {
    let port = 8080;
    const host = `http://localhost`;
    let app: any;
    let page: Page;
    let browser: Browser;

    beforeAll(async () => {
      jest.setTimeout(1000 * 60 * 2);
      port = await getPort();
      app = await launchApp(appDir, port, {});
      browser = await puppeteer.launch(launchOptions as any);
      page = await browser.newPage();
    });

    test('stream ssr with bff handle web', async () => {
      await page.goto(`${host}:${port}?name=bytedance`, {
        waitUntil: ['networkidle0'],
      });
      const text = await page.$eval('#item', el => el?.textContent);
      expect(text).toMatch('name: bytedance, age: 18');
    });

    test('stream ssr with bff handle web, client nav', async () => {
      await page.goto(`${host}:${port}/user`, {
        waitUntil: ['networkidle0'],
      });
      await page.click('#home-btn');
      await page.waitForSelector('#data');
      const text = await page.$eval('#data', el => el?.textContent);
      expect(text).toMatch('name: modernjs, age: 18');
    });

    test('api service should serve normally', async () => {
      try {
        const res = await fetch(`${host}:${port}/api/info`);
        const data = await res.json();
        expect(data).toEqual({
          company: 'bytedance',
          addRes: 3,
          url: '/api/info',
        });
      } catch (error) {
        console.error(error);
        throw error;
      }
    });

    afterAll(async () => {
      await killApp(app);
      await page.close();
      await browser.close();
    });
  });

  describe('pure-esm-project in prod', () => {
    let port = 8080;
    const host = `http://localhost`;
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

    test('stream ssr with bff handle web', async () => {
      await page.goto(`${host}:${port}?name=bytedance`, {
        waitUntil: ['networkidle0'],
      });
      const text = await page.$eval('#item', el => el?.textContent);
      expect(text).toMatch('name: bytedance, age: 18');
    });

    test('stream ssr with bff handle web, client nav', async () => {
      await page.goto(`${host}:${port}/user`, {
        waitUntil: ['networkidle0'],
      });
      await page.click('#home-btn');
      await page.waitForSelector('#data');
      const text = await page.$eval('#data', el => el?.textContent);
      expect(text).toMatch('name: modernjs, age: 18');
    });

    test('api service should serve normally', async () => {
      const res = await fetch(`${host}:${port}/api/info`);
      const data = await res.json();
      expect(data).toEqual({
        company: 'bytedance',
        addRes: 3,
        url: '/api/info',
      });
    });

    afterAll(async () => {
      await killApp(app);
      await page.close();
      await browser.close();
    });
  });
} else {
  test('should skip the test cases', () => {
    expect(true).toBe(true);
  });
}
