const fs = require('fs');
const path = require('path');
const { modernBuild } = require('../../../utils/modernTestUtils');

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath) {
  return fs.existsSync(path.join(appDir, 'dist/js', filePath));
}

describe('test build', () => {
  it(`should only the style file exists in 'dist/js' directory`, async () => {
    const buildRes = await modernBuild(appDir, ['--style-only']);
    expect(buildRes.code === 0).toBe(true);
    expect(existsSync('styles/index.css')).toBe(true);
    expect(existsSync('index.js')).not.toBe(true);
    expect(buildRes.stdout.includes('Run style compiler code log')).toBe(true);
    expect(buildRes.stdout.includes('Run babel compiler code log')).not.toBe(
      true,
    );
  });
});
