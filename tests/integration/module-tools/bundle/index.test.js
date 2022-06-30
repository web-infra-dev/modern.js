const fs = require('fs');
const path = require('path');
const { modernBuild } = require('../../../utils/modernTestUtils');

const appDir = path.join(__dirname, './');

function existsSync(filePath) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

describe('module tools build cli', () => {
  it(`less and sass support`, async () => {
    const buildRes = await modernBuild(appDir, [
      '--config',
      'modern.config.style.ts',
    ]);
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('style/index.css')).toBe(true);
  });

  it(`enable dts`, async () => {
    const buildRes = await modernBuild(appDir, [
      '--dts',
      '--config',
      'modern.config.dts.ts',
    ]);
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('dts/index.d.ts')).toBe(true);
    expect(existsSync('dts/index.js')).toBe(true);
  });
});
