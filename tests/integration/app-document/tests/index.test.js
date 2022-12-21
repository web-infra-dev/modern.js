// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
const {
  launchApp,
  killApp,
  getPort,
  modernBuild,
  modernServe,
} = require('../../../utils/modernTestUtils');

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

describe('test dev', () => {
  let app, appPort, errors;
  beforeAll(async () => {
    appPort = await getPort();
    app = await launchApp(appDir, appPort, {}, {});
    errors = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });
  afterAll(async () => {
    await killApp(app);
  });

  it(`should render page test correctly`, async () => {
    await page.goto(`http://localhost:${appPort}/test`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el.textContent, root);
    expect(targetText.trim()).toEqual('A');
    expect(errors.length).toEqual(0);
  });

  it(`should render page sub correctly`, async () => {
    await page.goto(`http://localhost:${appPort}/sub`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el.textContent, root);
    expect(targetText.trim()).toEqual('去 A去 B');
    expect(errors.length).toEqual(0);
  });

  it(`should render page sub route a correctly`, async () => {
    await page.goto(`http://localhost:${appPort}/sub/a`, {
      waitUntil: ['networkidle0'],
    });

    const root = await page.$('#root');
    const targetText = await page.evaluate(el => el.textContent, root);
    expect(targetText.trim()).toEqual('去 A去 B');
    expect(errors.length).toEqual(0);
  });
});

describe('test build', () => {
  let port = 8080;
  let buildRes, app;
  beforeAll(async () => {
    port = await getPort();

    buildRes = await modernBuild(appDir);

    app = await modernServe(appDir, port, {
      cwd: appDir,
    });
  });

  afterAll(async () => {
    await killApp(app);
  });

  it(`should get right alias build!`, async () => {
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('route.json')).toBe(true);
    expect(existsSync('html/test/index.html')).toBe(true);
    expect(existsSync('html/sub/index.html')).toBe(true);
  });
  it('should have the test html and the correct content', async () => {
    const htmlNoDoc = fs.readFileSync(
      path.join(appDir, 'dist', 'html/test/index.html'),
      'utf-8',
    );
    expect(htmlNoDoc.includes('<div id="root"><!--<?- html ?>--></div>'));
  });
  it('should have the sub html and the correct content', async () => {
    const htmlWithDoc = fs.readFileSync(
      path.join(appDir, 'dist', 'html/sub/index.html'),
      'utf-8',
    );
    expect(htmlWithDoc.includes('<div id="root"><!--<?- html ?>--><h1'));
  });
});
