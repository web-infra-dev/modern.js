import fs from 'fs';
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

describe('test basic rsc app', () => {
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
  });

  describe('test client component root', () => {
    const baseUrl = `client-component-root`;

    it('should render page correctly', () =>
      shouldRenderPageCorrectly({ baseUrl, appPort, page }));
    it('should render page with context correctly', () =>
      renderPageWithContext({ baseUrl, appPort, page }));
  });

  describe('test server component root', () => {
    const baseUrl = `server-component-root`;
    it('should render page correctly', () =>
      shouldRenderPageCorrectly({ baseUrl, appPort, page }));
  });
});

interface TestOptions {
  baseUrl: string;
  appPort: number;
  page: Page;
}

async function shouldRenderPageCorrectly({ baseUrl, appPort }: TestOptions) {
  let res;
  try {
    res = await fetch(`http://127.0.0.1:${appPort}/${baseUrl}`);
  } catch (error) {
    console.log('error', error);
    throw error;
  }

  const pageText = await res.text();

  expect(pageText?.trim()).toContain('Get started by editing');
}

async function renderPageWithContext({ baseUrl, appPort, page }: TestOptions) {
  await page.goto(`http://localhost:${appPort}/${baseUrl}`, {
    waitUntil: ['networkidle0'],
  });

  const useAgent = await page.$('.use-agent');
  const targetText = await page.evaluate(el => el?.textContent, useAgent);
  expect(targetText?.trim()).toEqual('string');
}
