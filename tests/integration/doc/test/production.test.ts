import path, { join } from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  getPort,
  killApp,
  modernBuild,
  modernServe,
  launchOptions,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('Check production build', () => {
  let app: any;
  let appDir: string;
  let appPort: number;
  let page: Page;
  let browser: Browser;
  beforeAll(async () => {
    appDir = join(fixtureDir, 'production');
    await modernBuild(appDir);
    app = await modernServe(appDir, (appPort = await getPort()), {
      cwd: appDir,
    });
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });
  afterAll(async () => {
    await killApp(app);
    if (page) {
      await page.close();
    }
    if (browser) {
      browser.close();
    }
  });
  it('check whether the page can be interacted', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const darkModeButton = await page.$('.modern-nav-appearance');
    const html = await page.$('html');
    let htmlClass = await page.evaluate(
      html => html?.getAttribute('class'),
      html,
    );
    const defaultMode = htmlClass?.includes('dark') ? 'dark' : 'light';
    await darkModeButton?.click();
    // check the class in html
    htmlClass = await page.evaluate(html => html?.getAttribute('class'), html);
    expect(htmlClass?.includes('dark')).toBe(defaultMode !== 'dark');
  });
});
