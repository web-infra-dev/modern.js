import path, { join } from 'path';
import type { Page } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  openPage,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('Check functions when base path exists', () => {
  let app: any;
  let appPort: number;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'with-base');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  it('Should render sidebar correctly', async () => {
    const page: Page = await openPage();
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: ['networkidle0'],
    });
    // take the sidebar
    const sidebar = await page.$$(
      '.modern-sidebar .modern-scrollbar > nav > section',
    );
    expect(sidebar?.length).toBe(1);
    await page.close();
    // get the section
  });

  it('Should goto correct link', async () => {
    const page: Page = await openPage();
    await page.goto(`http://localhost:${appPort}/base/en/guide/quick-start`, {
      waitUntil: ['networkidle0'],
    });
    const a = await page.$('.modern-doc a:not(.header-anchor)');
    // extract the href of a tag
    const href = await page.evaluate(a => a?.getAttribute('href'), a);
    expect(href).toBe('/base/en/guide/install.html');
  });
});
