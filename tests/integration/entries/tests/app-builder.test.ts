import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { existsSync } from '../../../../packages/toolkit/utils/compiled/fs-extra';

const fixtures = path.resolve(__dirname, '../fixtures');

describe('app-builder', () => {
  test(`entry should be the entry file`, async () => {
    const appDir = path.resolve(fixtures, 'app-builder');
    await modernBuild(appDir);

    expect(
      existsSync(path.join(appDir, 'dist/html/entry-1/index.html')),
    ).toBeTruthy();
    expect(
      existsSync(path.join(appDir, 'dist/html/entry-1/index.jsx')),
    ).toBeFalsy();
  });
});
