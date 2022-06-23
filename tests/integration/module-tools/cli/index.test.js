const fs = require('fs');
const path = require('path');
const { modernBuild } = require('../../../utils/modernTestUtils');

const appDir = path.join(__dirname, './');

function existsSync(filePath) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

describe('module tools build cli', () => {
  it(`style only`, async () => {
    const buildRes = await modernBuild(appDir, ['--style-only', '--config', 'modern.config.style.js']);
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('index.css')).toBe(true);
    expect(existsSync('index.js')).not.toBe(true);
  });

  it(`enable dts`, async () => {
    const buildRes = await modernBuild(appDir, ['--dts', '--config', 'modern.config.dts.js']);
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('dts/index.d.ts')).toBe(true);
    expect(existsSync('dts/index.js')).toBe(true);
  });

  it(`build platform`, async () => {
    const buildRes = await modernBuild(appDir, ['-p']);
    console.log(buildRes);
    expect(buildRes.code === 0).toBe(true);
  });
});
