const fs = require('fs');
const path = require('path');
const { modernBuild } = require('../../../utils/modernTestUtils');

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath) {
  return fs.existsSync(path.join(appDir, filePath));
}

describe('test temp-dir', () => {
  let buildRes;
  beforeAll(async () => {
    buildRes = await modernBuild(appDir);
  });

  it(`should get right alias build!`, async () => {
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('node_modules/.temp-dir/main')).toBe(true);
    expect(existsSync('node_modules/.temp-dir/.runtime-exports')).toBe(true);
  });
});
