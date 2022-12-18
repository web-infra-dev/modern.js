import path from 'path';
import { Page } from 'puppeteer';
import { launchApp, getPort, killApp } from '../../../../utils/modernTestUtils';

const appPath = path.resolve(__dirname, '../');

declare let page: Page;

describe('test status code page', () => {
  let app: any;
  let port: number;

  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 2);
    await page.deleteCookie();
    port = await getPort();

    app = await launchApp(appPath, port);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  it('should get request info correctly', async () => {
    const response = await page.goto(`http://localhost:${port}`);
    const header = response.headers();
    const text = await response.text();
    expect(text).toBe('hello modern');
    expect(header['x-index-middleware']).toMatch('true');
    expect(header['x-unstable-middleware']).toMatch('true');
  });
});
