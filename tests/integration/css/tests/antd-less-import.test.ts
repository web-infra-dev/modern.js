import path from 'path';
import puppeteer from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';
import { fixtures } from './utils';

describe('support babel plugin import', () => {
  const checkStyle = async (appDir: string, expectedColor: string) => {
    const port = await getPort();

    const app = await launchApp(appDir, port);

    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();

    await page.goto(`http://localhost:${port}`, {
      waitUntil: ['networkidle0'],
    });

    const bgColor = await page.$eval('button', button =>
      window.getComputedStyle(button).getPropertyValue('background-color'),
    );

    expect(bgColor).toBe(expectedColor);

    await killApp(app);
    await page.close();
    await browser.close();
  };

  test(`should import antd component with style`, async () => {
    await checkStyle(
      path.resolve(fixtures, 'antd-less-import'),
      'rgb(24, 144, 255)',
    );
  });
});
