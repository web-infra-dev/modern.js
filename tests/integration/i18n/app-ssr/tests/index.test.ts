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
  sleep,
} from '../../../../utils/modernTestUtils';
import { conditionalTest } from '../../test-utils';

const projectDir = path.resolve(__dirname, '..');

// Helper function to wait for element text content
async function waitForElementText(
  page: Page,
  selector: string,
  expectedText: string,
  timeout = 10000,
) {
  await page.waitForFunction(
    (sel, text) => {
      const el = document.querySelector(sel);
      return el && el.textContent !== null && el.textContent.trim() === text;
    },
    { timeout },
    selector,
    expectedText,
  );
}

// Helper function to verify page content
async function verifyPageContent(
  page: Page,
  url: string,
  expectedText: string,
  selector = '#key',
) {
  const response = await page.goto(url, {
    waitUntil: ['networkidle0'],
  });

  // Only run SSR content check locally
  if (process.env.LOCAL_TEST === 'true' && response) {
    const body = await response.text();
    expect(body).toContain(expectedText);
  }

  const element = await page.$(selector);
  expect(element).not.toBeNull();

  const textContent = await page.evaluate(el => el?.textContent, element);
  expect(textContent?.trim()).toBe(expectedText);
}

async function waitForBuildFile(filePath: string, timeout = 15_000) {
  const startTime = Date.now();

  while (!fs.existsSync(filePath)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timed out waiting for build output: ${filePath}`);
    }
    await sleep(200);
  }
}

describe('app-ssr-i18n', () => {
  let app: Awaited<ReturnType<typeof launchApp>>;
  let page: Page;
  let browser: Browser;
  let appPort: number;

  beforeAll(async () => {
    const appDir = projectDir;
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    // Disable cache for translation JSON requests to avoid 304 responses
    await page.setCacheEnabled(false);
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('should redirect root path to /en', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en`);

    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toBe(`http://localhost:${appPort}/en`);
  });

  conditionalTest(
    'should display Chinese content and switch to English',
    async () => {
      await verifyPageContent(
        page,
        `http://localhost:${appPort}/zh`,
        '你好，世界',
      );

      await page.click('#en-button');
      await waitForElementText(page, '#key', 'Hello World');
    },
  );

  conditionalTest(
    'should display English content and switch to Chinese',
    async () => {
      await verifyPageContent(
        page,
        `http://localhost:${appPort}/en`,
        'Hello World',
      );

      await page.click('#zh-button');
      await waitForElementText(page, '#key', '你好，世界');
    },
  );

  test('should serve static resources', async () => {
    const response = await page.goto(`http://localhost:${appPort}/text.txt`, {
      waitUntil: ['networkidle0'],
    });
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);

    const body = await response?.text();
    expect(body).toContain('test public');
  });

  test('should serve Chinese translation JSON', async () => {
    const response = await page.goto(
      `http://localhost:${appPort}/locales/zh/translation.json`,
      {
        waitUntil: ['networkidle0'],
      },
    );
    expect(response).not.toBeNull();
    // Accept both 200 (OK) and 304 (Not Modified) as valid responses
    // 304 means the resource hasn't changed and browser uses cached version
    expect([200, 304]).toContain(response?.status());

    const body = await response?.json();
    expect(body).toEqual({
      key: '你好，世界',
      about: '关于',
    });
  });

  test('should serve English translation JSON', async () => {
    const response = await page.goto(
      `http://localhost:${appPort}/locales/en/translation.json`,
      {
        waitUntil: ['networkidle0'],
      },
    );
    expect(response).not.toBeNull();
    // Accept both 200 (OK) and 304 (Not Modified) as valid responses
    // 304 means the resource hasn't changed and browser uses cached version
    expect([200, 304]).toContain(response?.status());

    const body = await response?.json();
    expect(body).toEqual({
      key: 'Hello World',
      about: 'About',
    });
  });
});

describe('app-ssr-i18n-request-detection', () => {
  let app: Awaited<ReturnType<typeof launchApp>>;
  let appPort: number;

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(
      projectDir,
      appPort,
      {},
      { I18N_REQUEST_DETECTION: 'true' },
    );
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  test.each([
    {
      source: 'regional query',
      url: '/?lng=zh-Hant-TW',
      headers: new Headers({ 'accept-language': 'en' }),
    },
    {
      source: 'regional cookie',
      url: '/',
      headers: new Headers({
        cookie: 'i18next=zh-CN',
        'accept-language': 'en',
      }),
    },
    {
      source: 'regional cookie after an unsupported query',
      url: '/?lng=fr-FR',
      headers: new Headers({
        cookie: 'i18next=zh-CN',
        'accept-language': 'en',
      }),
    },
  ])(
    'resolves $source to zh before the English header',
    async ({ url, headers }) => {
      // Inspect the raw response so redirects or client rendering cannot hide a
      // failed SSR language detection. Do not retry an SSR fallback.
      const response = await fetch(`http://localhost:${appPort}${url}`, {
        headers,
        redirect: 'manual',
      });
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('x-modernjs-render')).toBe('server');
      expect(html).not.toContain('__modern_ssr_fallback_reason__');
      expect(html).toContain('你好，世界');
      expect(html).toContain('"lng":"zh"');
    },
  );
});

describe('app-ssr-i18n-build-and-server', () => {
  let app: Awaited<ReturnType<typeof modernServe>>;
  let page: Page;
  let browser: Browser;
  let appPort: number;

  beforeAll(async () => {
    const appDir = projectDir;
    await modernBuild(appDir, ['--config', 'modern.config.ts']);

    // Verify build output
    const zhResourcePath = path.join(
      appDir,
      './dist/locales/zh/translation.json',
    );
    const enResourcePath = path.join(
      appDir,
      './dist/locales/en/translation.json',
    );

    await Promise.all([
      waitForBuildFile(zhResourcePath),
      waitForBuildFile(enResourcePath),
    ]);

    const zhContent = fs.readJsonSync(zhResourcePath);
    const enContent = fs.readJsonSync(enResourcePath);

    expect(zhContent).toEqual({
      key: '你好，世界',
      about: '关于',
    });
    expect(enContent).toEqual({
      key: 'Hello World',
      about: 'About',
    });

    appPort = await getPort();
    app = await modernServe(appDir, appPort);

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

  test('should serve English translation JSON in production', async () => {
    const response = await page.goto(
      `http://localhost:${appPort}/locales/en/translation.json`,
      {
        waitUntil: ['networkidle0'],
      },
    );
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);

    const body = await response?.json();
    expect(body).toEqual({
      key: 'Hello World',
      about: 'About',
    });
  });

  test('should serve Chinese translation JSON in production', async () => {
    const response = await page.goto(
      `http://localhost:${appPort}/locales/zh/translation.json`,
      {
        waitUntil: ['networkidle0'],
      },
    );
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);

    const body = await response?.json();
    expect(body).toEqual({
      key: '你好，世界',
      about: '关于',
    });
  });
});
