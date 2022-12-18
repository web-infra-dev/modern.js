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
    port = await getPort();

    app = await launchApp(appPath, port);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  it('should router rewrite correctly ', async () => {
    await page.goto(`http://localhost:${port}/rewrite`);
    const text = await page.$eval('#root', el => el.textContent);
    expect(text).toMatch('Entry Page');
  });

  it('should router redirect correctly ', async () => {
    const response = await page.goto(`http://localhost:${port}/redirect`);
    const text = await response.text();
    expect(text).toMatch('现代 Web 工程体系');
  });
});
