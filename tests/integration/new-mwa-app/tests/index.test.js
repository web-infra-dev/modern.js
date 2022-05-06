// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
const {
  launchApp,
  killApp,
  getPort,
  modernBuild,
  modernStart,
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

    page.on('pageerror', error => {
      errors.push(error.message);
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('.description');
    const targetText = await page.evaluate(el => el.textContent, root);
    expect(targetText.trim()).toEqual('Get started by editing src/App.tsx');
    expect(errors.length).toEqual(0);

    await killApp(app);
  });
});

describe('test build', () => {
  let port = 8080;
  let buildRes, app;
  beforeAll(async () => {
    port = await getPort();

    buildRes = await modernBuild(appDir);

    app = await modernStart(appDir, port, {
      cwd: appDir,
    });
  });

  afterAll(async () => {
    await killApp(app);
  });

  it(`should get right alias build!`, async () => {
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('asset-manifest.json')).toBe(true);
    expect(existsSync('route.json')).toBe(true);
    expect(existsSync('html/main/index.html')).toBe(true);
  });

  it('should support enableInlineScripts', async () => {
    const host = `http://localhost`;
    expect(buildRes.code === 0).toBe(true);
    await page.goto(`${host}:${port}`);

    const description = await page.$('.description');
    const targetText = await page.evaluate(el => el.textContent, description);
    expect(targetText.trim()).toEqual('Get started by editing src/App.tsx');
  });
});
