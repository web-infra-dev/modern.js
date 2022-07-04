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

describe('convention router', () => {
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
    const appDir = join(fixtureDir, 'file-based-router');
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

  test('file based router work well', async () => {
    await page.goto(getUrl('home'), {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toEqual(getUrl('home'));
    await page.goto(getUrl('about'), {
      waitUntil: ['networkidle0'],
    });
    expect(page.url()).toEqual(getUrl('about'));
    expect(errors.length).toEqual(0);
  });

  test('test dynamic router and _app', async () => {
    await page.goto(getUrl('home'), {
      waitUntil: ['networkidle0'],
    });

    const title = await page.$eval('.title', el => el.textContent);
    const initDisplay = await page.$eval('.display', el => el.textContent);

    await page.click('#kobe');
    await page.waitForSelector('.display');
    const firstDisplay = await page.$eval('.display', el => el.textContent);
    const firstUrl = page.url();

    await page.click('#lebron');
    await page.waitForSelector('.display');
    const secondDisplay = await page.$eval('.display', el => el.textContent);
    const secondUrl = page.url();

    expect(title).toEqual('_app');
    expect(initDisplay).toEqual('home page');
    expect(firstDisplay).toEqual('kobe');
    expect(firstUrl).toEqual(getUrl('home/users/kobe'));
    expect(secondDisplay).toEqual('lebron');
    expect(secondUrl).toEqual(getUrl('home/users/lebron'));
    expect(errors.length).toEqual(0);
  });

  test('undefined path redirect to 404', async () => {
    await page.goto(getUrl('abc'), {
      waitUntil: ['networkidle0'],
    });
    const text = await page.$eval('h1', el => el.textContent);
    expect(text).toEqual('404');
  });
});
