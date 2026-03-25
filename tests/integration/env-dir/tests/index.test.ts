import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchOptions,
  runModernCommand,
  runModernCommandDev,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('test env-dir dev', () => {
  let app: unknown;
  let page: Page;
  let browser: Browser;
  let appPort: number;

  beforeAll(async () => {
    appPort = await getPort();
    app = await runModernCommandDev(['dev', '--env-dir', './env'], undefined, {
      cwd: appDir,
      env: {
        PORT: appPort,
        NODE_ENV: 'development',
      },
    });
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  test('should load env variables from env-dir in development', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const modernTestVar = await page.$eval(
      '[data-testid="modern-test-var"]',
      el => el.textContent,
    );
    expect(modernTestVar).toContain('modern_dev_dir_value');

    const modernLocalVar = await page.$eval(
      '[data-testid="modern-local-var"]',
      el => el.textContent,
    );
    expect(modernLocalVar).toContain('local_dir_value');
  });
});

describe('test env-dir build and serve', () => {
  let app: unknown;
  let page: Page;
  let browser: Browser;
  let appPort: number;
  const host = `http://localhost`;

  beforeAll(async () => {
    appPort = await getPort();

    const buildRes = await runModernCommand(['build', '--env-dir', './env'], {
      cwd: appDir,
      stdout: true,
      stderr: true,
      env: {
        NODE_ENV: 'production',
      },
    });
    expect(buildRes.code).toBe(0);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();

    app = await runModernCommandDev(
      ['serve', '--env-dir', './env'],
      undefined,
      {
        cwd: appDir,
        env: {
          PORT: appPort,
          NODE_ENV: 'production',
        },
        modernServe: true,
      },
    );
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
    await killApp(app);
  });

  test('should load env variables from env-dir in production', async () => {
    await page.goto(`${host}:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const modernTestVar = await page.$eval(
      '[data-testid="modern-test-var"]',
      el => el.textContent,
    );
    expect(modernTestVar).toContain('modern_prod_dir_value');

    const modernLocalVar = await page.$eval(
      '[data-testid="modern-local-var"]',
      el => el.textContent,
    );
    expect(modernLocalVar).toContain('local_dir_value');
  });
});
