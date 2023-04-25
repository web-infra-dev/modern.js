import path from 'path';
import type { Page } from 'puppeteer';
import { launchApp, killApp, getPort } from '../../../utils/modernTestUtils';

declare const page: Page;

const appDir = path.resolve(__dirname, '../');

describe('dev', () => {
  let app: unknown;
  let appPort: number;
  const errors: string[] = [];
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  it('should return response header set in before correctly', async () => {
    const response = await page.goto(`http://localhost:${appPort}`);
    const headers = response!.headers();
    expect(headers['x-config']).toBe('test-config');
    expect(headers['x-plugin']).toBe('test-plugin');
  });

  afterAll(async () => {
    await killApp(app);
  });
});
