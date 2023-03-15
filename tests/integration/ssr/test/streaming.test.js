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
    const res = await page.goto(`http://localhost:${appPort}/about`, {
      waitUntil: ['networkidle0'],
    });

    const body = await res.text();
    // css chunks inject correctly
    expect(body).toMatch(
      /<link href="\/static\/css\/async\/about\/page.css" rel="stylesheet" \/>/,
    );

    expect(body).toMatch(
      /<div hidden id="S:0">[\s\S]*<div>About content<\/div>/,
    );
  });

  it(`deferred data`, async () => {
    await page.goto(`http://localhost:${appPort}/user/1`, {
      waitUntil: ['networkidle0'],
    });

    await expect(page).toMatchTextContent(/user1-18/);
  });

  it(`deferred data in client navigation`, async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    await page.click('#user-btn');
    await expect(page).toMatchTextContent(/user1-18/);
  });

  it('error thrown in loader', async () => {
    const res = await page.goto(`http://localhost:${appPort}/error`, {
      waitUntil: ['networkidle0'],
    });

    const body = await res.text();
    expect(body).toMatch(/Something went wrong!.*error occurs/);
  });

  // TODO: wait for the next version of react-router to support this case
  // it('redirect in loader', async () => {
  //   const res = await page.goto(`http://localhost:${appPort}/redirect`, {
  //     waitUntil: ['networkidle0'],
  //   });

  //   const body = await res.text();
  //   expect(body).toMatch(/Root layout/);
  //   expect(body).not.toMatch(/Redirect page/);
  // });
});
