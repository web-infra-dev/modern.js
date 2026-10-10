import path from 'path';
import puppeteer, {
  type Browser,
  type BrowserContext,
  type Page,
} from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';
import { waitForHydration } from '../../test-utils';

const projectDir = path.resolve(__dirname, '..');
const traditionalText = '你好，世界（繁體中文）';

describe('i18n-custom-i18n-wrapper', () => {
  let app: Awaited<ReturnType<typeof launchApp>>;
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let appPort: number;

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(projectDir, appPort);
    browser = await puppeteer.launch(launchOptions as any);
  });

  beforeEach(async () => {
    context = await browser.createBrowserContext();
    page = await context.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en' });
  });

  afterEach(async () => {
    await context?.close();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  const getText = async (selector: string) => {
    await page.waitForSelector(selector, { timeout: 5_000 });
    return page.$eval(selector, element => element.textContent?.trim());
  };

  // Preserve the two existing CSR cases from custom-i18n-wrapper.
  test('loads SDK translations through the context instance', async () => {
    const response = await page.goto(`http://localhost:${appPort}/csr/en`, {
      waitUntil: 'networkidle0',
    });

    expect(response?.headers()['x-modernjs-render']).toBe('client');
    const initialText = await getText('#sdk-text');
    expect(['Hello World from HTTP', 'Hello World from SDK']).toContain(
      initialText,
    );

    await page.waitForFunction(
      () =>
        document.querySelector('#sdk-text')?.textContent ===
        'Hello World from SDK',
    );
    expect(await getText('#sdk-text')).toBe('Hello World from SDK');
  });

  test('updates context translations when switching languages', async () => {
    await page.goto(`http://localhost:${appPort}/csr/en`, {
      waitUntil: 'networkidle0',
    });
    await page.waitForFunction(
      () =>
        document.querySelector('#sdk-text')?.textContent ===
        'Hello World from SDK',
    );

    await page.click('#switch-zh');
    await page.waitForFunction(() =>
      ['你好，世界（HTTP）', '你好，世界（SDK）'].includes(
        document.querySelector('#sdk-text')?.textContent ?? '',
      ),
    );
    expect(['你好，世界（HTTP）', '你好，世界（SDK）']).toContain(
      await getText('#sdk-text'),
    );

    await page.click('#switch-en');
    await page.waitForFunction(() =>
      ['Hello World from HTTP', 'Hello World from SDK'].includes(
        document.querySelector('#sdk-text')?.textContent ?? '',
      ),
    );
    expect(['Hello World from HTTP', 'Hello World from SDK']).toContain(
      await getText('#sdk-text'),
    );
  });

  test.each([
    { source: 'query', query: '?lng=zh-Hant-TW', headers: new Headers() },
    {
      source: 'cookie',
      query: '',
      headers: new Headers({ cookie: 'i18next=zh-Hant-TW' }),
    },
    {
      source: 'header',
      query: '',
      headers: new Headers({ 'accept-language': 'zh-Hant-TW,zh;q=0.9' }),
    },
  ])(
    'detects $source language in the SSR response',
    async ({ query, headers }) => {
      // Read the server response directly so client rendering or redirects cannot
      // hide a failed SSR language detection. Do not retry after an SSR fallback.
      const response = await fetch(`http://localhost:${appPort}/${query}`, {
        headers,
        redirect: 'manual',
      });
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('x-modernjs-render')).toBe('server');
      expect(html).not.toContain('__modern_ssr_fallback_reason__');
      expect(html).toContain(traditionalText);
      expect(html).toContain('Current Language: <!-- -->zh-Hant-TW');
      expect(html).toContain('"lng":"zh-Hant-TW"');
    },
  );

  test('keeps the SSR language after hydration', async () => {
    const response = await page.goto(
      `http://localhost:${appPort}/?lng=zh-Hant-TW`,
      {
        waitUntil: 'networkidle0',
      },
    );
    const html = await response?.text();

    expect(html).toContain(traditionalText);
    expect(html).toContain('"lng":"zh-Hant-TW"');
    await waitForHydration(page, '#translated-text');
    await page.waitForFunction(
      text => document.querySelector('#translated-text')?.textContent === text,
      {},
      traditionalText,
    );
    expect(page.url()).toBe(`http://localhost:${appPort}/?lng=zh-Hant-TW`);
  });

  test('detects query language in CSR without a locale redirect', async () => {
    const url = `http://localhost:${appPort}/csr/detect?lng=zh-Hant-TW`;
    const response = await page.goto(url, { waitUntil: 'networkidle0' });

    expect(response?.headers()['x-modernjs-render']).toBe('client');
    expect(response?.request().redirectChain()).toHaveLength(0);
    expect(await getText('#sdk-text')).toBe(traditionalText);
    expect(await getText('#current-lang')).toContain('zh-Hant-TW');
    expect(page.url()).toBe(url);
  });

  test('initializes the imported custom instance for direct t() calls in CSR', async () => {
    const response = await page.goto(
      `http://localhost:${appPort}/csr?lng=zh-Hant-TW`,
      { waitUntil: 'networkidle0' },
    );

    expect(response?.headers()['x-modernjs-render']).toBe('client');
    await page.waitForSelector('#direct-text');
    expect(await page.$eval('#direct-text', node => node.textContent)).toBe(
      traditionalText,
    );
    expect(
      await page.$eval('#current-lang', node => node.textContent),
    ).toContain('zh-Hant-TW');
    expect(page.url()).toBe(
      `http://localhost:${appPort}/csr/zh-Hant-TW?lng=zh-Hant-TW`,
    );

    await page.click('#switch-en');
    await page.waitForFunction(
      () =>
        document.querySelector('#direct-text')?.textContent ===
        'Hello World from SDK',
    );
    expect(page.url()).toBe(
      `http://localhost:${appPort}/csr/en?lng=zh-Hant-TW`,
    );
    await page.click('#switch-zh-hant-tw');
    await page.waitForFunction(
      text => document.querySelector('#direct-text')?.textContent === text,
      {},
      traditionalText,
    );
  });
});
