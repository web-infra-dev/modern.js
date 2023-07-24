import path from 'path';
import getPort from 'get-port';
import puppeteer, { Browser } from 'puppeteer';
import { fs } from '@modern-js/utils';
import {
  launchApp,
  launchOptions,
  killApp,
  sleep,
} from '../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, './app-ts-loader');

jest.setTimeout(1000 * 60 * 2);

describe('source build', () => {
  let app: any;
  let browser: Browser;
  let port: number;
  let common: {
    codeDir: string;
    original: string;
  };

  beforeAll(async () => {
    port = await getPort();
    app = await launchApp(appDir, port, {});
    browser = await puppeteer.launch(launchOptions as any);
    const commonIndexPath = path.join(__dirname, './common/src/index.ts');
    common = {
      codeDir: commonIndexPath,
      original: await fs.readFile(commonIndexPath, 'utf8'),
    };
  });
  test('should run successfully', async () => {
    expect(app.exitCode).toBe(null);
    // browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);
    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText).toMatch('1.0.0');
  });

  test('update component project code', async () => {
    const newContent = common.original.replace(/1.0.0/g, '2.0.0');
    await fs.writeFile(common.codeDir, newContent);
    await sleep(2000);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}`);
    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el?.textContent, root);

    expect(targetText).toMatch('2.0.0');
  });

  afterAll(async () => {
    browser.close();
    await killApp(app);
    await fs.writeFile(common.codeDir, common.original);
  });
});
