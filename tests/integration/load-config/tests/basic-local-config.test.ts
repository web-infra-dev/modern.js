import path from 'path';
import { existsSync } from 'fs';
import {
  getPort,
  killApp,
  launchApp,
  modernBuild,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

const appDir = path.resolve(fixtures, 'basic-local-config');

describe('basic local config', () => {
  test(`should load local config when running dev command`, async () => {
    const appPort = await getPort();
    const app = await launchApp(appDir, appPort);
    expect(
      existsSync(path.join(appDir, 'dist/bar/html/main/index.html')),
    ).toBeTruthy();
    await killApp(app);
  });

  test(`should not load local config when running build command`, async () => {
    await modernBuild(appDir);
    expect(
      existsSync(path.join(appDir, 'dist/foo/html/main/index.html')),
    ).toBeTruthy();
  });
});
