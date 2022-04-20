const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  killApp,
  getPort,
  modernBuild,
} = require('../../../utils/modernTestUtils');

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

describe('test build', () => {
  it(`should get right alias build!`, async () => {
    const buildRes = await modernBuild(appDir);
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('asset-manifest.json')).toBe(true);
    expect(existsSync('route.json')).toBe(true);
    expect(existsSync('html/main/index.html')).toBe(true);
  });

  it(`should render page correctly`, async () => {
    const appPort = await getPort();
    const app = await launchApp(
      appDir,
      appPort,
      {},
      {
        // FIXME: disable the fast refresh plugin to avoid the `require` not found issue.
        FAST_REFRESH: 'false',
      },
    );
    const errors = [];

    const browser = await puppeteer.launch({ headless: true, dumpio: true });
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.text));
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el.textContent, root);
    expect(targetText.trim()).toEqual('Hello Modern.js! 1');
    expect(errors.length).toEqual(0);

    browser.close();
    await killApp(app);
  });
});
