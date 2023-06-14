const { join } = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  getPort,
  killApp,
  launchOptions,
} = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');

async function basicUsage(page, appPort) {
  const res = await page.goto(`http://localhost:${appPort}/about`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res.text();
  // css chunks inject correctly
  expect(body).toMatch(
    /<link href="\/static\/css\/async\/about\/page.css" rel="stylesheet" \/>/,
  );

  expect(body).toMatch(/<div hidden id="S:0">[\s\S]*<div>About content<\/div>/);
}

async function deferredData(page, appPort) {
  await page.goto(`http://localhost:${appPort}/user/1`, {
    waitUntil: ['networkidle0'],
  });

  await expect(page).toMatchTextContent(/user1-18/);
}

async function deferredDataInNavigation(page, appPort) {
  await page.goto(`http://localhost:${appPort}`, {
    waitUntil: ['networkidle0'],
  });

  await page.click('#user-btn');
  await expect(page).toMatchTextContent(/user1-18/);
}

async function errorThrownInLoader(page, appPort) {
  const res = await page.goto(`http://localhost:${appPort}/error`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res.text();
  expect(body).toMatch(/Something went wrong!.*error occurs/);
}

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

    browser = await puppeteer.launch(launchOptions);
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
    await basicUsage(page, appPort);
  });

  it(`deferred data`, async () => {
    await deferredData(page, appPort);
  });

  it(`deferred data in client navigation`, async () => {
    await deferredDataInNavigation(page, appPort);
  });

  it('error thrown in loader', async () => {
    await errorThrownInLoader(page, appPort);
  });

  // TODO: wait for the next version of react-router to support this case
  it.skip('redirect in loader', async () => {
    const res = await page.goto(`http://localhost:${appPort}/redirect`, {
      waitUntil: ['networkidle0'],
    });

    const body = await res.text();
    expect(body).toMatch(/Root layout/);
    expect(body).not.toMatch(/Redirect page/);
  });
});

describe('Streaming SSR with rspack', () => {
  let app,
    appPort,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'streaming');
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, { BUNDLER: 'rspack' });

    browser = await puppeteer.launch(launchOptions);
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
    await basicUsage(page, appPort);
  });

  it(`deferred data`, async () => {
    await deferredData(page, appPort);
  });

  it(`deferred data in client navigation`, async () => {
    await deferredDataInNavigation(page, appPort);
  });

  it('error thrown in loader', async () => {
    await errorThrownInLoader(page, appPort);
  });
});
