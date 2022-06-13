const path = require('path');
const { readdirSync } = require('fs-extra');
const {
  modernBuild,
  clearBuildDist,
} = require('../../../utils/modernTestUtils');

const { getCssFiles } = require('./utils');

beforeAll(() => {
  jest.setTimeout(1000 * 60 * 2);
});

afterAll(() => {
  clearBuildDist(fixtures);
});

const getPreCssFiles = (appDir, ext) =>
  readdirSync(path.resolve(appDir, 'dist')).filter(filepath =>
    new RegExp(`\\.${ext}$`).test(filepath),
  );

const fixtures = path.resolve(__dirname, '../fixtures');

describe('test pre-css exclude util', () => {
  it(`should exclude specified less file`, async () => {
    const appDir = path.resolve(fixtures, 'exclude-less');

    await modernBuild(appDir);

    const lessFiles = getPreCssFiles(appDir, 'less');

    const cssFiles = getCssFiles(appDir, 'css');

    expect(lessFiles.length).toBe(1);

    expect(cssFiles.length).toBe(1);
  });

  it(`should exclude specified sass file`, async () => {
    const appDir = path.resolve(fixtures, 'exclude-sass');

    await modernBuild(appDir);

    const sassFiles = getPreCssFiles(appDir, 'scss');

    const cssFiles = getCssFiles(appDir, 'css');

    expect(sassFiles.length).toBe(1);

    expect(cssFiles.length).toBe(1);
  });
});
