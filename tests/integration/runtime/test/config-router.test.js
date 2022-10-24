const { join } = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  getPort,
  killApp,
} = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');

// jest.setTimeout(60000);

describe('config router', () => {
  const logs = [];
  const errors = [];
  let app,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser,
    appPort;

  const getUrl = str => `http://localhost:${appPort}/${str}`;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'config-router');
    appPort = await getPort();

    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch({ headless: true, dumpio: true });
    page = await browser.newPage();

    page.on('console', msg => logs.push(msg.text));
    page.on('pageerror', error => errors.push(error.text));
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  test('basic used', async () => {
    await page.goto(getUrl(''), {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toEqual(getUrl(''));
    const layout = await page.$eval('#layout', el => el.textContent);
    expect(layout).toEqual('Layout');
    expect(await page.title()).toEqual('home');

    // go page apple
    await page.click('#btn-apple');
    // has layout
    const appleLayout = await page.$eval('#layout', el => el.textContent);
    const apple = await page.$eval('#apple', el => el.textContent);
    expect(await page.title()).toEqual('apple');
    expect(page.url()).toEqual(getUrl('apple'));
    expect(appleLayout).toEqual('Layout');
    expect(apple).toEqual('I like apple');
    expect(errors.length).toEqual(0);
  });

  test('dynamic router', async () => {
    await page.click('#btn-banana');
    const bananaLayout1 = await page.$eval('#layout', el => el.textContent);
    const banana1 = await page.$eval('#banana', el => el.textContent);
    const bananaUrl1 = page.url();

    await page.goto(getUrl('banana/456'), {
      waitUntil: ['networkidle0'],
    });

    await page.waitForSelector('#banana');
    const bananaLayout2 = await page.$eval('#layout', el => el.textContent);
    const banana2 = await page.$eval('#banana', el => el.textContent);
    const bananaUrl2 = page.url();

    expect(await page.title()).toEqual('banana');
    expect(bananaLayout1).toEqual('Layout');
    expect(bananaLayout2).toEqual('Layout');
    expect(banana1).toEqual('banana: 123');
    expect(banana2).toEqual('banana: 456');
    expect(bananaUrl1).toEqual(getUrl('banana/123'));
    expect(bananaUrl2).toEqual(getUrl('banana/456'));
  });

  test('redirect', async () => {
    // /toapple will redirect to /apple
    await page.goto(getUrl('toapple'), {
      waitUntil: ['networkidle0'],
    });
    const apple = await page.$eval('#apple', el => el.textContent);
    expect(apple).toEqual('I like apple');
    expect(page.url()).toEqual(getUrl('apple'));
    expect(await page.title()).toEqual('apple');
  });

  test('undefined path redirect to 404', async () => {
    await page.goto(getUrl('abc'), {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$eval('h1', el => el.textContent);
    expect(text).toEqual('404 in config routes');
    expect(await page.title()).toEqual('404');
  });
});
