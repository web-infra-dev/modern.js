import path from 'path';
import { existsSync } from 'fs';
import getPort from 'get-port';
import { runModernCommandDev, killApp } from '../../../utils/modernTestUtils';

describe('select entry', () => {
  test(`should only compile selected entry`, async () => {
    const appDir = path.resolve(__dirname, '..', 'fixtures/select-one-entry');
    const port = await getPort();
    const app = await runModernCommandDev(
      ['dev', '--entry', 'foo'],
      undefined,
      {
        cwd: appDir,
        env: {
          NODE_ENV: 'development',
          PORT: port,
        },
      },
    );

    expect(existsSync(path.join(appDir, 'dist/html/foo/index.html'))).toBe(
      true,
    );
    expect(existsSync(path.join(appDir, 'dist/html/bar/index.html'))).toBe(
      false,
    );
    expect(existsSync(path.join(appDir, 'dist/html/baz/index.html'))).toBe(
      false,
    );

    await killApp(app);
  });
});
