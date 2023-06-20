const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const {
  launchApp,
  killApp,
  getPort,
  modernBuild,
  launchOptions,
} = require('../../../utils/modernTestUtils');

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

describe('test dev', () => {
  it(`should render page correctly`, async () => {
    const appPort = await getPort();
    const app = await launchApp(appDir, appPort, {}, {});
    const errors = [];
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('.description');
    const targetText = await page.evaluate(el => el?.textContent, root);
    expect(targetText?.trim()).toEqual('Get started by editing src/App.tsx');
    expect(errors.length).toEqual(0);

    await killApp(app);
    await page.close();
    await browser.close();
  });
});

describe('test build', () => {
  let buildRes;
  beforeAll(async () => {
    buildRes = await modernBuild(appDir);
  });

  it(`should get right entry name build!`, async () => {
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('route.json')).toBe(true);
    expect(existsSync('html/index/index.html')).toBe(true);
    const html = fs.readFileSync(
      path.join(appDir, 'dist', 'html/index/index.html'),
      'utf-8',
    );
    expect(html).toContain('TikTok');
  });
});
