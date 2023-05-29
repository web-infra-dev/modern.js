import path, { join } from 'path';
import { Page } from 'puppeteer';
import {
  modernServe,
  openPage,
  modernBuild,
  getPort,
  killApp,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

jest.setTimeout(1000 * 60 * 2);

describe('ssg', () => {
  let app: any;
  let appDir: string;
  let appPort: number;
  let page: Page;
  beforeAll(async () => {
    appDir = join(fixtureDir, 'nested-routes');
    await modernBuild(appDir);
    app = await modernServe(appDir, (appPort = await getPort()), {
      cwd: appDir,
    });
    page = await openPage();
  });
  afterAll(async () => {
    await killApp(app);
    await page.close();
  });

  it('should nested-routes ssg access / work correctly', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const element = await page.$('#data');
    const targetText = await page.evaluate(el => el?.textContent, element);
    expect(targetText).toBe('Hello, Home');
  });

  it('should nested-routes ssg access /user work correctly', async () => {
    await page.goto(`http://localhost:${appPort}/user`, {
      waitUntil: ['networkidle0'],
    });
    const element = await page.$('#data');
    const targetText = await page.evaluate(el => el?.textContent, element);
    expect(targetText).toBe('Hello, User');
  });
});
