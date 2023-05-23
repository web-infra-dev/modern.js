import path from 'path';
import { Page } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  openPage,
} from '../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');

describe('test nonce', () => {
  let app: any;
  let port: number;
  let page: Page;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    page = await openPage();
    await page.deleteCookie();
    port = await getPort();

    app = await launchApp(appPath, port);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
    await page.close();
  });

  it('should inject nonce correctly', async () => {
    await page.goto(`http://localhost:${port}`);

    const scriptArr = await page.$$eval('head > script', scripts =>
      scripts
        .filter(script => script.type !== 'application/json')
        .map(script => {
          return script.nonce;
        }),
    );

    const nonceArr = scriptArr.filter(nonce => nonce === 'test-nonce');
    expect(nonceArr.length).toBe(scriptArr.length);
  });
});
