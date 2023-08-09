import path, { join } from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import { fs } from '@modern-js/utils';
import {
  modernServe,
  launchOptions,
  modernBuild,
  getPort,
  killApp,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

jest.setTimeout(1000 * 60 * 2);

describe('ssg', () => {
  let app: any;
  let appDir: string;
  let page: Page;
  let browser: Browser;
  let distDir: string;
  beforeAll(async () => {
    appDir = join(fixtureDir, 'nested-routes');
    distDir = join(appDir, './dist');
    await modernBuild(appDir);
    app = await modernServe(appDir, await getPort(), {
      cwd: appDir,
    });
    browser = await puppeteer.launch(launchOptions as any);
    page = await browser.newPage();
  });
  afterAll(async () => {
    await killApp(app);
    await page.close();
    await browser.close();
  });

  test('should nested-routes ssg access / work correctly', async () => {
    const htmlPath = path.join(distDir, 'html/main/index.html');
    const html = (await fs.readFile(htmlPath)).toString();
    expect(html.includes('Hello, Home')).toBe(true);
  });

  test('should nested-routes ssg access /user work correctly', async () => {
    const htmlPath = path.join(distDir, 'html/main/user/index.html');
    const html = (await fs.readFile(htmlPath)).toString();
    expect(html.includes('Hello, User')).toBe(true);
  });
});
