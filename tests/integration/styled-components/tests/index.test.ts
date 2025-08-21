import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureStreamDir = path.resolve(__dirname, '../fixtures/stream');
const fixtureStringDir = path.resolve(__dirname, '../fixtures/string');

async function checkStyledComponentsInHtml(page: Page) {
  const html = await page.content();
  expect(html).toContain('styled-components is working');

  const hasInlineStyle =
    html.includes('style="color: red"') ||
    html.includes('style="color:#ff0000"') ||
    html.includes('style="color:rgb(255,0,0)"');

  const styleSheetRegex =
    /<style[^>]*>[\s\S]*?color:\s*(red|#ff0000|rgb\(255,\s*0,\s*0\))/i;
  const hasStyleInStyleSheet = styleSheetRegex.test(html);

  const elementWithStyleRegex =
    /<div[^>]*>(.*?styled-components is working.*?)<\/div>[\s\S]*?style="color:\s*(red|#ff0000|rgb\(255,\s*0,\s*0\))/i;
  const hasElementWithStyle = elementWithStyleRegex.test(html);

  const styleFound =
    hasInlineStyle || hasStyleInStyleSheet || hasElementWithStyle;

  expect(styleFound).toBe(true);
}

describe('Styled Components with Streaming SSR', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(fixtureStreamDir, appPort, {});

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();

    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['domcontentloaded'],
      timeout: 60000,
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('should render page content correctly', async () => {
    await (expect(page) as any).toMatchTextContent('Hello, world!');
    await (expect(page) as any).toMatchTextContent(
      'styled-components is working',
    );
  });

  test('should have correct mode and renderLevel in SSR_DATA', async () => {
    const html = await page.content();
    const ssrDataMatch = html.match(
      /<script>window\._SSR_DATA = (.*?)<\/script>/,
    );
    expect(ssrDataMatch).not.toBeNull();

    const ssrData = JSON.parse(ssrDataMatch![1]);
    expect(ssrData.mode).toBe('stream');
    expect(ssrData.renderLevel).toBe(2);
  });

  test('should inject style tags', async () => {
    const styleTags = await page.$$('style');
    expect(styleTags.length).toBeGreaterThan(0);
  });

  test('should apply correct styles to components in initial HTML', async () => {
    await checkStyledComponentsInHtml(page);
  });
});

describe('Styled Components with string SSR', () => {
  let app: any;
  let appPort: number;
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(fixtureStringDir, appPort, {});

    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0', 'load'],
      timeout: 60000,
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('should render page content correctly', async () => {
    await (expect(page) as any).toMatchTextContent('Hello, world!');
    await (expect(page) as any).toMatchTextContent(
      'styled-components is working',
    );
  });

  test('should have correct mode and renderLevel in SSR_DATA', async () => {
    const html = await page.content();
    const ssrDataMatch = html.match(
      /<script>window\._SSR_DATA = (.*?)<\/script>/,
    );
    expect(ssrDataMatch).not.toBeNull();

    const ssrData = JSON.parse(ssrDataMatch![1]);
    expect(ssrData.mode).toBe('string');
    expect(ssrData.renderLevel).toBe(2);
  });

  test('should inject style tags', async () => {
    const styleTags = await page.$$('style');
    expect(styleTags.length).toBeGreaterThan(0);
  });

  test('should apply correct styles to components in initial HTML', async () => {
    await checkStyledComponentsInHtml(page);
  });
});
