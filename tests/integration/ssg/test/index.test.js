const { join } = require('path');
const path = require('path');
const { fs } = require('zx');
const { modernBuild } = require('../../../utils/modernTestUtils');

const fixtureDir = path.resolve(__dirname, '../fixtures');

jest.setTimeout(1000 * 60);

describe('ssg', () => {
  it('should simple ssg work correctly', async () => {
    const appDir = join(fixtureDir, 'simple');
    await modernBuild(appDir);

    const htmlPath = path.join(appDir, './dist/html/main/index.html');
    const content = fs.readFileSync(htmlPath, 'utf-8');
    expect(content).toMatch('Hello, Modern.js');
  });

  it('should web-server ssg work correctly', async () => {
    const appDir = join(fixtureDir, 'web-server');
    await modernBuild(appDir);

    const htmlPath = path.join(appDir, './dist/html/main/index.html');
    const content = fs.readFileSync(htmlPath, 'utf-8');
    expect(content).toMatch('Hello, Modern.js');
    expect(content).toMatch('bytedance');
  });
});
