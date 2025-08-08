import path from 'path';
import { fs } from '@modern-js/utils';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath: string) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

describe('test dev', () => {
  let app: unknown;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });
  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });
  test(`should render page correctly`, async () => {
    const errors = [];
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('.description');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('Get started by editing src/App.tsx');
    expect(errors.length).toEqual(0);
  });

  test('should load env variables correctly in development', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    // Test if MODERN_ prefixed environment variables are loaded correctly
    const modernTestVar = await page.$eval(
      '[data-testid="modern-test-var"]',
      el => el.textContent,
    );
    expect(modernTestVar).toContain('modern_dev_value'); // Should use value from .env.development

    // Test if NODE_ENV is set correctly
    const nodeEnv = await page.$eval(
      '[data-testid="node-env"]',
      el => el.textContent,
    );
    expect(nodeEnv).toContain('development');

    // Test if variables from .env.local are loaded correctly
    const modernLocalVar = await page.$eval(
      '[data-testid="modern-local-var"]',
      el => el.textContent,
    );
    expect(modernLocalVar).toContain('local_value');
  });
});

describe('test build', () => {
  let port = 8080;
  let buildRes: { code: number };
  let app: unknown;
  let page: Page;
  let browser: Browser;
  const host = `http://localhost`;
  beforeAll(async () => {
    port = await getPort();

    process.env.DEBUG = 'rsbuild';
    buildRes = await modernBuild(appDir);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();

    app = await modernServe(appDir, port, {
      cwd: appDir,
    });
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
    await killApp(app);
    delete process.env.DEBUG;
  });

  test(`should get right alias build!`, async () => {
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('route.json')).toBe(true);
    expect(existsSync('html/main/index.html')).toBe(true);
  });

  test('should visit page correctly', async () => {
    expect(buildRes.code === 0).toBe(true);
    await page.goto(`${host}:${port}`);

    const description = await page.$('.description');
    const targetText = await page.evaluate(
      (el: any) => el?.textContent,
      description,
    );
    expect(targetText?.trim()).toEqual('Get started by editing src/App.tsx');
  });

  test('should load env variables correctly in production', async () => {
    await page.goto(`${host}:${port}`, {
      waitUntil: ['networkidle0'],
    });

    // Test if MODERN_ prefixed environment variables are loaded correctly
    const modernTestVar = await page.$eval(
      '[data-testid="modern-test-var"]',
      el => el.textContent,
    );
    expect(modernTestVar).toContain('modern_prod_value'); // Should use value from .env.production

    // Test if NODE_ENV is set correctly
    const nodeEnv = await page.$eval(
      '[data-testid="node-env"]',
      el => el.textContent,
    );
    expect(nodeEnv).toContain('production');

    // Test if variables from .env.local are loaded correctly
    const modernLocalVar = await page.$eval(
      '[data-testid="modern-local-var"]',
      el => el.textContent,
    );
    expect(modernLocalVar).toContain('local_value');
  });
});
