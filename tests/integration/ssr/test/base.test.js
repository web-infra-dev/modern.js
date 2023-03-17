const { join } = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  getPort,
  killApp,
} = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('Traditional SSR', () => {
  let app,
    appPort,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'base');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch({
      headless: true,
      dumpio: true,
      args: ['--no-sandbox'],
    });
    page = await browser.newPage();
    page.setDefaultTimeout(10000);
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  it(`basic usage`, async () => {
    await page.goto(`http://localhost:${appPort}/user/1`, {
      waitUntil: ['networkidle0'],
    });
    await expect(page).toMatchTextContent('user1-18');
  });

  it.skip(`client navigation works`, async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    await page.click('#user-btn');
    await expect(page).toMatchTextContent('user1-18');
  });

  it('error thrown in loader', async () => {
    await page.goto(`http://localhost:${appPort}/error`, {
      waitUntil: ['networkidle0'],
    });

    await expect(page).toMatchTextContent(/error occurs/);
  });

  it('error thrown in client navigation', async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    await page.click('#error-btn');
    await expect(page).toMatchTextContent(
      /{"status":500,"statusText":"Internal Server Error","internal":false,"data":"Error: error occurs"}/,
    );
  });

  it('redirect in loader', async () => {
    const res = await page.goto(`http://localhost:${appPort}/redirect`, {
      waitUntil: ['networkidle0'],
    });

    const body = await res.text();
    expect(body).toMatch(/Root layout/);
    expect(body).not.toMatch(/Redirect page/);
  });
});
