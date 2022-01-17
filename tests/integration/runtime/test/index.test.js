const { join } = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  getPort,
  killApp,
  sleep,
} = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('useLoader with SSR', () => {
  let $data;
  let logs = [];
  let errors = [];
  let app,
    /** @type {puppeteer.Page} */
    page,
    /** @type {puppeteer.Browser} */
    browser;

  beforeAll(async () => {
    const appDir = join(fixtureDir, 'use-loader');
    const appPort = await getPort();
    app = await launchApp(appDir, appPort);

    browser = await puppeteer.launch({ headless: true, dumpio: true });
    page = await browser.newPage();

    page.on('console', msg => logs.push(msg.text));
    page.on('pageerror', error => errors.push(error.text));
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });
    $data = await page.$('#data');
  });

  afterAll(async () => {
    if (browser) {
      browser.close();
    }
    if (app) {
      await killApp(app);
    }
  });

  it(`use ssr data without load request`, async () => {
    logs = [];
    errors = [];
    const targetText = await page.evaluate(el => el.textContent, $data);
    expect(targetText).toEqual('0');
    expect(logs.join('\n')).not.toMatch('useLoader exec with params: ');
    expect(errors.length).toEqual(0);
  });

  it(`update data when loadId changes`, async () => {
    logs = [];
    errors = [];
    await page.click('#add');
    await sleep(2000);
    const targetText = await page.evaluate(el => el.textContent, $data);
    expect(targetText).toEqual('1');

    const logMsg = logs.join('\n');
    expect(logMsg).not.toMatch('useLoader exec with params: 1');
    expect(logMsg).not.toMatch('useLoader success: 1');
  });

  it(`useLoader reload without params`, async () => {
    logs = [];
    errors = [];
    await page.click('#reload');
    await sleep(2000);
    const targetText = await page.evaluate(el => el.textContent, $data);
    expect(targetText).toEqual('1');

    const logMsg = logs.join('\n');
    expect(logMsg).not.toMatch('useLoader exec with params: 1');
    expect(logMsg).not.toMatch('useLoader success: 1');
  });

  it(`useLoader reload with params`, async () => {
    logs = [];
    errors = [];
    await page.click('#update');
    await sleep(2000);
    const targetText = await page.evaluate(el => el.textContent, $data);
    expect(targetText).toEqual('100');

    const logMsg = logs.join('\n');
    expect(logMsg).not.toMatch('useLoader exec with params: 100');
    expect(logMsg).not.toMatch('useLoader success: 100');
  });
});
