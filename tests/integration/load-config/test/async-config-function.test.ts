import path from 'path';
import { existsSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

describe('local config', () => {
  it(`should allow config file to export an async function`, async () => {
    const appDir = path.resolve(fixtures, 'async-config-function');
    await modernBuild(appDir);

    expect(
      existsSync(path.join(appDir, 'dist/foo/html/main/index.html')),
    ).toBeTruthy();
  });
});
