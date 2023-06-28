import path from 'path';
import { existsSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

const appDir = path.resolve(fixtures, 'basic-local-config');

describe('basic local config', () => {
  beforeAll(async () => {
    await modernBuild(appDir);
  });

  it(`should load local config when running dev command`, async () => {
    expect(
      existsSync(path.join(appDir, 'dist/bar/html/main/index.html')),
    ).toBeTruthy();
  });

  it(`should not load local config when running build command`, async () => {
    expect(
      existsSync(path.join(appDir, 'dist/foo/html/main/index.html')),
    ).toBeTruthy();
  });
});
