import path, { join } from 'path';
import { Page } from 'puppeteer';
import {
  launchApp,
  getPort,
  killApp,
  openPage,
} from '../../../utils/modernTestUtils';

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('I18n doc render', () => {
  let app: any;
  let appPort: number;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'i18n');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);
  });

  afterAll(async () => {
    if (app) {
      await killApp(app);
    }
  });

  // check the language switch button
  it('Language switch button', async () => {
    const page: Page = await openPage();
    await page.goto(`http://localhost:${appPort}/en/`, {
      waitUntil: ['networkidle0'],
    });

    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('Index');

    const button = await page.$('.translation .nav-menu-group-button')!;
    expect(button).toBeTruthy();
    // hover the button
    await button!.hover();
    // click the button content to switch to English
    const buttonContent = await page.$(
      '.translation .nav-menu-group-content > div > div:nth-child(1)',
    );
    await buttonContent!.click();
    await page.waitForNavigation();
    // check the language is English
    const title = await page.$('h1');
    const titleText = await page.evaluate(title => title?.textContent, title);
    await expect(titleText).toContain('首页');
    await page.close();
  });

  it('Add language prefix in route automatically', async () => {
    // Chinese
    const page: Page = await openPage();
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    // take the `点击` button
    let link = await page.$('.modern-doc p a')!;
    expect(link).toBeTruthy();
    // get the href
    let href = await page.evaluate(link => link?.getAttribute('href'), link);
    expect(href).toBe('/guide/quick-start.html');

    // English
    // switch to English
    await page.goto(`http://localhost:${appPort}/en/`, {
      waitUntil: ['networkidle0'],
    });
    // take the `click` button
    link = await page.$('.modern-doc p a')!;
    expect(link).toBeTruthy();
    // get the href
    href = await page.evaluate(link => link?.getAttribute('href'), link);
    expect(href).toBe('/en/guide/quick-start.html');
    await page.close();
  });

  it('Should render sidebar correctly', async () => {
    const page: Page = await openPage();
    await page.goto(`http://localhost:${appPort}/guide/quick-start`, {
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

  it('Should not render appearance switch button', async () => {
    const page: Page = await openPage();
    await page.goto(`http://localhost:${appPort}/guide/quick-start`, {
      waitUntil: ['networkidle0'],
    });
    // take the appearance switch button
    const button = await page.$('.modern-nav-appearance');
    expect(button).toBeFalsy();
    await page.close();
  });
});
