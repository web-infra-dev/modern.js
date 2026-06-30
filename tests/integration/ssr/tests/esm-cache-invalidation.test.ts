import dns from 'node:dns';
import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

dns.setDefaultResultOrder('ipv4first');
const fixtureDir = path.resolve(__dirname, '../fixtures');
const pagePath = join(
  fixtureDir,
  'esm-cache-invalidation',
  'src/routes/page.tsx',
);

const ORIGINAL_TEXT = 'Welcome to111';
const MODIFIED_TEXT = 'ESM-CACHE-REPRODUCE';

describe('ESM Cache Invalidation - Issue #8373', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'esm-cache-invalidation');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    // Restore file to original content after test
    const currentContent = await fs.readFile(pagePath, 'utf-8');
    if (currentContent.includes(MODIFIED_TEXT)) {
      await fs.writeFile(
        pagePath,
        currentContent.replace(MODIFIED_TEXT, ORIGINAL_TEXT),
      );
    }

    if (browser) await browser.close();
    if (app) await killApp(app);
  });

  test('reproduce hydration mismatch bug from issue #8373', async () => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', message => {
      consoleMessages.push(message.text());
    });

    page.on('pageerror', error => {
      const msg = error instanceof Error ? error.message : String(error);
      pageErrors.push(msg);
    });

    // Ensure file starts with original content
    let fileContent = await fs.readFile(pagePath, 'utf-8');
    if (!fileContent.includes(ORIGINAL_TEXT)) {
      fileContent = fileContent.replace(/ESM-CACHE-\w+/g, ORIGINAL_TEXT);
      await fs.writeFile(pagePath, fileContent);
      await new Promise(r => setTimeout(r, 2000));
    }

    // Load initial page
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    await new Promise(r => setTimeout(r, 1000));

    const content = await page.content();
    expect(content).toMatch(new RegExp(ORIGINAL_TEXT));

    // Modify file
    fileContent = await fs.readFile(pagePath, 'utf-8');
    await fs.writeFile(
      pagePath,
      fileContent.replace(ORIGINAL_TEXT, MODIFIED_TEXT),
    );

    // Wait 500ms (as user described)
    await new Promise(r => setTimeout(r, 500));

    // Refresh browser
    await page.reload({ waitUntil: ['networkidle0'] });
    await new Promise(r => setTimeout(r, 3000));

    const refreshedContent = await page.content();

    expect(refreshedContent).toMatch(new RegExp(MODIFIED_TEXT));
    expect(refreshedContent).not.toMatch(new RegExp(ORIGINAL_TEXT));

    // Check for hydration mismatch error
    const hydrationSignals = [...pageErrors, ...consoleMessages].filter(
      err =>
        err.includes('Hydration failed') ||
        err.includes('did not match') ||
        err.includes('rendered text') ||
        err.includes('Hydration mismatch'),
    );

    expect(hydrationSignals.length).toBe(0);
  });
});
