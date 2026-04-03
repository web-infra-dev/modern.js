import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import { modernBuild } from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 2, hookTimeout: 1000 * 60 * 2 });

const fixtureDir = path.resolve(__dirname, '../fixtures');

describe('ssg', () => {
  test('should simple ssg work correctly', async () => {
    const appDir = join(fixtureDir, 'simple');
    await modernBuild(appDir);

    const htmlPath = path.join(appDir, './dist/html/index/index.html');
    const content = fs.readFileSync(htmlPath, 'utf-8');
    expect(content).toMatch('Hello, Modern.js');
  });
});
