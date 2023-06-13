const { join } = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const { fs } = require('@modern-js/utils');
const {
  launchApp,
  getPort,
  killApp,
} = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');

async function basicUsage(page, appPort) {
  await page.goto(`http://localhost:${appPort}/user/1`, {
    waitUntil: ['networkidle0'],
  });
  await expect(page).toMatchTextContent('user1-18');
}

async function errorThrown(page, appPort) {
  await page.goto(`http://localhost:${appPort}/error`, {
    waitUntil: ['networkidle0'],
  });

  await expect(page).toMatchTextContent(/error occurs/);
}

async function errorThrownInClientNavigation(page, appPort) {
  await page.goto(`http://localhost:${appPort}`, {
    waitUntil: ['networkidle0'],
  });

  await page.click('#error-btn');
  await expect(page).toMatchTextContent(
    /{"status":500,"statusText":"Internal Server Error","internal":false,"data":"Error: error occurs"}/,
  );
}

async function redirectInLoader(page, appPort) {
  const res = await page.goto(`http://localhost:${appPort}/redirect`, {
    waitUntil: ['networkidle0'],
  });

  const body = await res.text();
  expect(body).toMatch(/Root layout/);
  expect(body).not.toMatch(/Redirect page/);
}

async function checkIsPassChunkLoadingGlobal() {
  const modernJsDir = join(fixtureDir, 'base', 'node_modules', '.modern-js');
  const entryFilePath = join(modernJsDir, 'main', 'index.jsx');
  const content = await fs.readFile(entryFilePath, 'utf-8');
  expect(content).toMatch(/chunkLoadingGlobal/);
}

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
      headless: 'new',
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
    await basicUsage(page, appPort);
  });

  it(`should pass chunkLoadingGlobal`, async () => {
    await checkIsPassChunkLoadingGlobal();
  });

  it.skip(`client navigation works`, async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    await page.click('#user-btn');
    await expect(page).toMatchTextContent('user1-18');
  });

  it('error thrown in loader', async () => {
    await errorThrown(page, appPort);
  });

  it('error thrown in client navigation', async () => {
    await errorThrownInClientNavigation(page, appPort);
  });

  it('redirect in loader', async () => {
    await redirectInLoader(page, appPort);
  });
});

describe('Traditional SSR with rspack', () => {
  let app,
    appPort,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'base');
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, { BUNDLER: 'rspack' });

    browser = await puppeteer.launch({
      headless: 'new',
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
    await basicUsage(page, appPort);
  });

  it.skip(`client navigation works`, async () => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    await page.click('#user-btn');
    await expect(page).toMatchTextContent('user1-18');
  });

  it('error thrown in loader', async () => {
    await errorThrown(page, appPort);
  });

  it('error thrown in client navigation', async () => {
    await errorThrownInClientNavigation(page, appPort);
  });

  it('redirect in loader', async () => {
    await redirectInLoader(page, appPort);
  });
});
