import path from 'path';
import { existsSync } from 'fs';
import { runModernCommandDev, killApp } from '../../../utils/modernTestUtils';

describe('select entry', () => {
  it(`should only compile selected entry`, async () => {
    const appDir = path.resolve(__dirname, '..');

    const app = await runModernCommandDev(
      ['dev', '--entry', 'foo'],
      undefined,
      {
        cwd: appDir,
        env: {
          NODE_ENV: 'development',
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

  it(`should allow to select multiple entry`, async () => {
    const appDir = path.resolve(__dirname, '..');

    const app = await runModernCommandDev(
      ['dev', '--entry', 'foo,bar'],
      undefined,
      {
        cwd: appDir,
        env: {
          NODE_ENV: 'development',
        },
      },
    );

    expect(existsSync(path.join(appDir, 'dist/html/foo/index.html'))).toBe(
      true,
    );
    expect(existsSync(path.join(appDir, 'dist/html/bar/index.html'))).toBe(
      true,
    );
    expect(existsSync(path.join(appDir, 'dist/html/baz/index.html'))).toBe(
      false,
    );

    await killApp(app);
  });
});
