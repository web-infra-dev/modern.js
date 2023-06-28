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
    port = await getPort();

    app = await launchApp(appPath, port);
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await page.close();
    await browser.close();
  });

  test('should template api work correctly ', async () => {
    const response = await page.goto(`http://localhost:${port}`);
    const text = await response!.text();

    expect(text).toMatch('<meta name="text-append" content="hello modern">');
    expect(text).toMatch('<meta name="text-prepend" content="hello modern">');
    expect(text).toMatch('<div id="append">appendBody</div>');
    expect(text).toMatch('<div id="prepend">prependBody</div>');
    expect(text).toMatch('set-extra');
  });
});
