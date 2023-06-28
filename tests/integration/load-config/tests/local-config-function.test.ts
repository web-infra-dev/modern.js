import path from 'path';
import { existsSync } from 'fs';
import { getPort, killApp, launchApp } from '../../../utils/modernTestUtils';

describe('local config', () => {
  test(`should load local config in function format correctly`, async () => {
    const fixtures = path.resolve(__dirname, '../fixtures');

    const appDir = path.resolve(fixtures, 'local-config-function');
    const appPort = await getPort();
    const app = await launchApp(appDir, appPort);

    expect(
      existsSync(path.join(appDir, 'dist/bar/html/main/index.html')),
    ).toBeTruthy();
    await killApp(app);
  });
});
