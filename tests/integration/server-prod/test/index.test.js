const path = require('path');
const fs = require('fs');
const axios = require('axios');
const {
  modernBuild,
  clearBuildDist,
  modernStart,
  getPort,
  killApp,
} = require('../../../utils/modernTestUtils');

const appPath = path.resolve(__dirname, '../');
const successStatus = 200;
let app, appPort;

beforeAll(async () => {
  await modernBuild(appPath);
  appPort = await getPort();
});

afterAll(async () => {
  if (app) {
    await killApp(app);
  }
  clearBuildDist(appPath);
});

describe('test basic usage', () => {
  it(`should have favicon and app icon in dist and html`, async () => {
    const favicon = path.resolve(appPath, './dist/favicon.ico');
    const favicon1 = path.resolve(appPath, './dist/favicon1.ico');
    const appIcon = path.resolve(appPath, './dist/static/image/icon.png');
    expect(fs.existsSync(favicon)).toBe(true);
    expect(fs.existsSync(favicon1)).toBe(true);
    expect(fs.existsSync(appIcon)).toBe(true);

    const mainEntry = path.resolve(appPath, './dist/html/main/index.html');
    const activityEntry = path.resolve(
      appPath,
      './dist/html/activity/index.html',
    );
    expect(fs.readFileSync(mainEntry, 'utf-8')).toMatch(
      '<link rel="icon" href="/favicon.ico">',
    );
    const mediaPath = path.join('static', 'image', 'icon.png');
    expect(fs.readFileSync(mainEntry, 'utf-8')).toMatch(
      `<link rel="apple-touch-icon" sizes="180*180" href="/${mediaPath}">`,
    );
    expect(fs.readFileSync(activityEntry, 'utf-8')).toMatch(
      '<link rel="icon" href="/favicon.ico">',
    );
    expect(fs.readFileSync(activityEntry, 'utf-8')).toMatch(
      `<link rel="apple-touch-icon" sizes="180*180" href="/${mediaPath}">`,
    );
  });

  it(`should start successfully`, async () => {
    app = await modernStart(appPath, appPort);
    expect(app.pid).toBeDefined();

    const { status } = await axios.get(`http://localhost:${appPort}`);
    expect(status).toBe(successStatus);

    const { status: aStatus } = await axios.get(
      `http://localhost:${appPort}/activity`,
    );
    expect(aStatus).toBe(successStatus);
  });

  it(`should serve favicon and app icon`, async () => {
    // eslint-disable-next-line no-unused-vars
    const { status, headers } = await axios.get(
      `http://localhost:${appPort}/favicon1.ico`,
    );
    expect(status).toBe(successStatus);
    // ignore
    // expect(headers['content-type']).toMatch(/image/);

    const { status: aStatus, headers: aHeaders } = await axios.get(
      `http://localhost:${appPort}/favicon.ico`,
    );
    expect(aStatus).toBe(successStatus);
    expect(aHeaders['content-type']).toBe('image/x-icon');
  });

  it(`should serve app icon`, async () => {
    const { status, headers } = await axios.get(
      `http://localhost:${appPort}/static/image/icon.png`,
    );
    expect(status).toBe(successStatus);
    expect(headers['content-type']).toBe('image/png');
  });
});
