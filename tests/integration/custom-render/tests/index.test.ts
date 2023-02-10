import path from 'path';
import type { Page } from 'puppeteer';
import { getPort, killApp, launchApp } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');
declare const page: Page;

describe('custom render', () => {
  let app: any;
  let appPort: number;
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
  });
  afterAll(async () => {
    await killApp(app);
  });

  it(`should add custom div correctly`, async () => {
    await page.goto(`http://localhost:${appPort}/test`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#csr');
    const targetText = await page.evaluate(el => el.textContent, root);
    expect(targetText.trim()).toEqual('Custom Render');
  });
});
