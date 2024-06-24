import path from 'path';
import getPort from 'get-port';
import puppeteer from 'puppeteer';
import {
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

describe('custom runtime plugin', () => {
  test(`should render custom plugin value`, async () => {
    const appDir = path.resolve(
      __dirname,
      '..',
      'fixtures/custom-runtime-plugin',
    );
    const appPort = await getPort();
    const app = await launchApp(appDir, appPort, {}, {});
    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    await page.waitForSelector('.description');
    const root = await page.$('.description');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('custom plugin');
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
