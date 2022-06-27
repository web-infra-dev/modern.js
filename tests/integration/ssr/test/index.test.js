const { join } = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  getPort,
  killApp,
} = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');

jest.setTimeout(1000 * 20);

describe('init with SSR', () => {
  let app,
    appPort,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'init');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch({ headless: true, dumpio: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  it(`use ssr init data`, async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    const element = await page.$('#data');
    const targetText = await page.evaluate(el => el.textContent, element);

    expect(targetText).toMatch('server');
  });

  it(`use ssr init data`, async () => {
    await page.goto(`http://localhost:${appPort}?browser=true`, {
      waitUntil: ['networkidle0'],
    });
    const element = await page.$('#data');
    const targetText = await page.evaluate(el => el.textContent, element);

    expect(targetText).toMatch('client');
  });
});
