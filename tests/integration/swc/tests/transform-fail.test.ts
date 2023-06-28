import path from 'path';
import type { ChildProcess } from 'child_process';
import getPort from 'get-port';
import { runModernCommandDev } from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

describe('swc transform failed minify', () => {
  test('should not exit unexpectly when transform failed', async () => {
    const appDir = path.resolve(fixtures, 'transform-fail');
    const port = await getPort();
    const cp: ChildProcess = await runModernCommandDev(['dev'], false, {
      cwd: appDir,
      env: {
        NODE_ENV: 'development',
        PORT: port,
      },
    });

    expect(cp).toBeDefined();
    expect(cp.exitCode).toBe(null);

    cp.kill('SIGTERM');
  });
});
