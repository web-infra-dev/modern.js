import path from 'path';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';
import { fixtures } from './utils';

describe('use twin.macro v2', () => {
  test(`should show style by use tailwindcss theme when use twin.macro v2`, async () => {
    const appDir = path.resolve(fixtures, 'twin.macro-v2');

    const port = await getPort();

    const app = await launchApp(appDir, port);

    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`);

    const textColor = await page.$eval('p', p =>
      window.getComputedStyle(p).getPropertyValue('color'),
    );

    expect(textColor).toBe('rgb(255, 0, 0)');

    await killApp(app);
    await page.close();
    await browser.close();
  });
});
