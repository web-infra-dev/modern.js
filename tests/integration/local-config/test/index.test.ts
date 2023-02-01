import path from 'path';
import { existsSync } from 'fs';
import {
  launchApp,
  killApp,
  modernBuild,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

describe('local config', () => {
  it(`should load local config when running dev command`, async () => {
    const appDir = path.resolve(fixtures, 'basic-local-config');
    const app = await launchApp(appDir);

    expect(
      existsSync(path.join(appDir, 'dist/bar/html/main/index.html')),
    ).toBeTruthy();

    killApp(app);
  });

  it(`should not load local config when running build command`, async () => {
    const appDir = path.resolve(fixtures, 'basic-local-config');
    await modernBuild(appDir);

    expect(
      existsSync(path.join(appDir, 'dist/foo/html/main/index.html')),
    ).toBeTruthy();
  });
});
