/* eslint-disable no-undef */
const { join } = require('path');
const path = require('path');
const {
  installDeps,
  clearBuildDist,
  launchApp,
  getPort,
  killApp,
  sleep,
} = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');
let appPort;

beforeAll(async () => {
  installDeps(fixtureDir);
  appPort = await getPort();
});

afterAll(() => {
  clearBuildDist(fixtureDir);
});

describe('useLoader with SSR', () => {
  let $data;
  let logs = [];
  let errors = [];
  let app;
  beforeAll(async () => {
    const appDir = join(fixtureDir, 'use-loader');
    app = await launchApp(appDir, appPort);
    page.on('console', msg => logs.push(msg.text));
    page.on('pageerror', error => errors.push(error.text));
    await page.goto(`http://localhost:${appPort}`);
    $data = await page.$('#data');
  });

  afterAll(async () => {
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
    await sleep(1000);
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
    await sleep(1000);
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
    await sleep(1000);
    const targetText = await page.evaluate(el => el.textContent, $data);
    expect(targetText).toEqual('100');

    const logMsg = logs.join('\n');
    expect(logMsg).not.toMatch('useLoader exec with params: 100');
    expect(logMsg).not.toMatch('useLoader success: 100');
  });
});
/* eslint-enable no-undef */
