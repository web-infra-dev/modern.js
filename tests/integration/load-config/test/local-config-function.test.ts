import path from 'path';
import { existsSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

describe('local config', () => {
  it(`should load local config in function format correctly`, async () => {
    const fixtures = path.resolve(__dirname, '../fixtures');

    const appDir = path.resolve(fixtures, 'local-config-function');
    await modernBuild(appDir);

    expect(
      existsSync(path.join(appDir, 'dist/bar/html/main/index.html')),
    ).toBeTruthy();
  });
});
