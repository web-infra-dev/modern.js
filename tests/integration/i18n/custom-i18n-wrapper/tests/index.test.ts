import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';

const projectDir = path.resolve(__dirname, '..');

describe('i18n-custom-i18n-wrapper', () => {
  let app: Awaited<ReturnType<typeof launchApp>>;
  let page: Page;
  let browser: Browser;
  let appPort: number;

  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(projectDir, appPort);
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

  const getText = async (selector: string) => {
    await page.waitForSelector(selector, { timeout: 5_000 });
    const el = await page.$(selector);
    return page.evaluate(elm => elm?.textContent?.trim(), el);
  };

  test('loads HTTP resources first then refresh with SDK', async () => {
    await page.goto(`http://localhost:${appPort}/en`, {
      waitUntil: ['networkidle0'],
    });

    const initialText = await getText('#sdk-text');
    expect(['Hello World from HTTP', 'Hello World from SDK']).toContain(
      initialText,
    );

    await new Promise(resolve => setTimeout(resolve, 1500));
    expect(await getText('#sdk-text')).toBe('Hello World from SDK');
  });

  test('language switch keeps SDK merge', async () => {
    await page.goto(`http://localhost:${appPort}/en`, {
      waitUntil: ['networkidle0'],
    });
    await new Promise(resolve => setTimeout(resolve, 1500));

    await page.click('#switch-zh');
    await new Promise(resolve => setTimeout(resolve, 1500));
    const zhText = await getText('#sdk-text');
    expect(['你好，世界（HTTP）', '你好，世界（SDK）']).toContain(zhText);

    await page.click('#switch-en');
    await new Promise(resolve => setTimeout(resolve, 1500));
    const backToEn = await getText('#sdk-text');
    expect(['Hello World from HTTP', 'Hello World from SDK']).toContain(
      backToEn,
    );
  });
});
