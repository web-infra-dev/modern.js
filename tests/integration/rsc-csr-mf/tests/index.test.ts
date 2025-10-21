import path from 'path';
import { isVersionAtLeast18 } from '@modern-js/utils';
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

interface TestConfig {
  bundler: 'webpack' | 'rspack';
  mode: 'dev' | 'build';
}

interface TestOptions {
  baseUrl: string;
  appPort: number;
  page: Page;
}

function skipForLowerNodeVersion() {
  if (!isVersionAtLeast18()) {
    test('should skip in lower node version', () => {
      expect(true).toBe(true);
    });
    return true;
  }
  return false;
}

function runTests({ bundler, mode }: TestConfig) {
  describe(`${mode} with ${bundler}`, () => {
    let app: any;
    let appPort: number;
    let page: Page | undefined;
    let browser: Browser | undefined;
    const errors: string[] = [];

    if (skipForLowerNodeVersion()) {
      return;
    }

    const shutdown = async () => {
      try {
        if (page) {
          await page.close();
        }
      } catch (err) {
        console.error('Failed to close page', err);
      } finally {
        page = undefined;
      }

      try {
        if (browser) {
          await browser.close();
        }
      } catch (err) {
        console.error('Failed to close browser', err);
      } finally {
        browser = undefined;
      }

      try {
        if (app) {
          await killApp(app);
        }
      } catch (err) {
        console.error('Failed to kill app', err);
      } finally {
        app = null;
      }
    };

    beforeAll(async () => {
      appPort = await getPort();

      try {
        if (mode === 'dev') {
          app = await launchApp(
            appDir,
            appPort,
            {},
            {
              BUNDLER: bundler,
              ASSET_PREFIX: `http://localhost:${appPort}`,
            },
          );
        } else {
          await modernBuild(appDir, [], {
            env: {
              BUNDLER: bundler,
              ASSET_PREFIX: `http://localhost:${appPort}`,
            },
          });
          app = await modernServe(appDir, appPort, {
            cwd: appDir,
            env: {
              PORT: appPort,
              NODE_ENV: 'production',
              ASSET_PREFIX: `http://localhost:${appPort}`,
            },
          });
        }

        browser = await puppeteer.launch(launchOptions as any);
        page = await browser.newPage();

        if (mode === 'build' && page) {
          page.on('pageerror', error => {
            errors.push(error.message);
          });
        }
      } catch (error) {
        await shutdown();
        throw error;
      }
    });

    afterAll(async () => {
      await shutdown();
    });

    describe('csr and rsc', () => {
      const baseUrl = `/`;

      it('should render page correctly', () =>
        renderServerRootPageCorrectly({ baseUrl, appPort, page: page! }));

      it(`should support ${mode === 'dev' ? 'client and ' : ''}server actions`, () =>
        supportServerAction({ baseUrl, appPort, page: page! }));
    });
  });
}

async function renderServerRootPageCorrectly({
  baseUrl,
  appPort,
  page,
}: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  // Check for expected content on the page
  const elementsToCheck = [
    { name: 'Client State', selector: 'body' },
    { name: 'Server State', selector: 'body' },
    { name: 'Dynamic Message', selector: 'body' },
    { name: 'countStateFromServer', selector: 'body' },
  ];

  for (const { name, selector } of elementsToCheck) {
    const elementExists = await page.$eval(
      selector,
      (el, name) => {
        return el.textContent?.includes(name);
      },
      name,
    );
    expect(elementExists).toBe(true);
  }
}

async function supportServerAction({ baseUrl, appPort, page }: TestOptions) {
  await page.goto(`http://localhost:${appPort}${baseUrl}`, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
  });

  let clientCount = await page.$eval('.client-count', el => el.textContent);
  let serverCount = await page.$eval('.server-count', el => el.textContent);
  expect(clientCount).toBe('0');
  expect(serverCount).toBe('0');

  await page.click('.client-increment');
  clientCount = await page.$eval('.client-count', el => el.textContent);
  expect(clientCount).toBe('1');

  await page.click('.server-increment');
  await page.waitForFunction(
    () =>
      !document.querySelector('.server-increment')?.hasAttribute('disabled'),
  );
  serverCount = await page.$eval('.server-count', el => el.textContent);
  expect(serverCount).toBe('1');
}

runTests({ bundler: 'webpack', mode: 'dev' });
runTests({ bundler: 'webpack', mode: 'build' });
