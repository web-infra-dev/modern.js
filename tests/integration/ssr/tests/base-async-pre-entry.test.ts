import dns from 'node:dns';
import path, { join } from 'path';
import { fs, MAIN_ENTRY_NAME } from '@modern-js/utils';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

dns.setDefaultResultOrder('ipv4first');

describe('enableAsyncPreEntry', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  let appDir: string;

  beforeAll(async () => {
    appDir = join(fixtureDir, 'base-async-pre-entry');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

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

  test('should inject preEntry into index.jsx (not bootstrap.jsx)', () => {
    const internalDir = path.join(
      appDir,
      'node_modules/.modern-js',
      MAIN_ENTRY_NAME,
    );
    const indexFile = path.join(internalDir, 'index.jsx');
    const bootstrapFile = path.join(internalDir, 'bootstrap.jsx');

    const indexCode = fs.readFileSync(indexFile, 'utf8');
    const bootstrapCode = fs.readFileSync(bootstrapFile, 'utf8');

    // preEntry import should be the first statement(s) of index.jsx
    expect(indexCode.startsWith('import')).toBeTruthy();
    expect(indexCode).toContain('pre.ts');

    // bootstrap.jsx should remain an async boundary only
    expect(bootstrapCode).not.toContain('pre.ts');
    expect(bootstrapCode).toContain(
      `import(/* webpackChunkName: "async-${MAIN_ENTRY_NAME}" */ './index');`,
    );
  });

  test('should execute preEntry in async entry scenario', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'load',
    });

    await page.waitForSelector('#pre-entry-flag');
    await page.waitForFunction(() => {
      return document.querySelector('#pre-entry-flag')?.textContent === '1';
    });

    const text = await page.$eval('#pre-entry-flag', el => el.textContent);
    expect(text).toBe('1');
  });
});
