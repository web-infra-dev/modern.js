const { join } = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  getPort,
  killApp,
} = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('Streaming SSR', () => {
  let app,
    appPort,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'streaming');
    appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch({
      headless: true,
      dumpio: true,
      args: ['--no-sandbox'],
    });
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

  it(`basic usage`, async () => {
    const res = await page.goto(`http://localhost:${appPort}/user`, {
      waitUntil: ['networkidle0'],
    });

    const body = await res.text();
    // css chunks inject correctly
    expect(body).toMatch(
      /<link href="\/static\/css\/async\/user\/page.css" rel="stylesheet" \/>/,
    );

    expect(body).toMatch(/<div hidden id="S:1">[\s\S]*<div>About Page<\/div>/);
  });
});
