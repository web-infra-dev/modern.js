import path from 'path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
  getPort,
  killApp,
  launchApp,
  launchOptions,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 2, hookTimeout: 1000 * 60 * 2 });

const appDir = path.resolve(__dirname, '../');
let app: any;
let appPort: number;

beforeAll(async () => {
  appPort = await getPort();
});

afterAll(async () => {
  if (app) {
    await killApp(app);
  }
});

describe('test basic usage', () => {
  test(`should start successfully`, async () => {
    app = await launchApp(appDir, appPort, {}, {});
    const browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const scriptType1 = await page.$eval('#__MODERN_ROUTER_DATA__', el => {
      return el.getAttribute('type');
    });
    const scriptType2 = await page.$eval('#__MODERN_ROUTER_DATA__', el => {
      return el.getAttribute('type');
    });

    expect(scriptType1).toBe('application/json');
    expect(scriptType2).toBe('application/json');

    await page.close();
    await browser.close();
  });
});
