import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} from '../../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');

describe('test status code page', () => {
  let app: any;
  let port: number;
  let page: Page;
  let browser: Browser;
  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
    await page.deleteCookie();
    port = await getPort();

    app = await launchApp(appPath, port);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await page.close();
    await browser.close();
  });

  it('should get request info correctly', async () => {
    const pathname = '/testpathname';
    await page.deleteCookie();
    await page.setExtraHTTPHeaders({
      'x-test-header': 'modern-header',
      cookie: 'age=18;',
    });
    await page.goto(`http://localhost:${port}${pathname}?name=modern-team`);
    const text = await page.$eval('#append', el => el?.textContent);
    expect(text).toMatch(pathname);
    expect(text).toMatch('modern-team');
    expect(text).toMatch('modern-header');
    expect(text).toMatch(`localhost:${port}`);
    // Todo puppeteer cookie mistake
    // expect(text).toMatch('18yearold');
  });
});
