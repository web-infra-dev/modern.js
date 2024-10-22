import path from 'path';
import getPort from 'get-port';
import puppeteer from 'puppeteer';
import {
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

describe('custom runtime config plugin', () => {
  test(`should set router basename`, async () => {
    const appDir = path.resolve(
      __dirname,
      '..',
      'fixtures/runtime-custom-config-plugin',
    );
    const appPort = await getPort();
    const app = await launchApp(appDir, appPort, {}, {});
    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${appPort}/test`, {
      waitUntil: ['networkidle0'],
    });
    await page.waitForSelector('#page');
    const root = await page.$('#page');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('page');
    await killApp(app);
    await page.close();
    await browser.close();
  });
});
