const path = require('path');
const {
  modernBuild,
  // markGuardian,
  installDeps,
  clearBuildDist,
} = require('../../../utils/modernTestUtils');

const appPath = path.resolve(__dirname, '../');

beforeAll(() => {
  installDeps(appPath);
});

afterAll(() => {
  clearBuildDist(appPath);
});

describe('test build', () => {
  it(`should get right alias build!`, async () => {
    const buildRes = await modernBuild(appPath);
    expect(buildRes.code === 0).toBe(true);
  });
});
