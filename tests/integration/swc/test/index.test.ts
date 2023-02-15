import path from 'path';
import { readdirSync, readFileSync } from 'fs';
import type { ChildProcess } from 'child_process';
import {
  modernBuild,
  runModernCommandDev,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

const getJsFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/js')).filter(filepath =>
    /\.js$/.test(filepath),
  );

describe('swc minify', () => {
  it(`should emitted script files correctly`, async () => {
    const appDir = path.resolve(fixtures, 'minify-js');

    await modernBuild(appDir);

    const files = getJsFiles(appDir);
    const mainFile = files.filter(filepath => filepath.startsWith('main'))[0];

    expect(files.length).toBe(3);
    expect(
      readFileSync(path.resolve(appDir, `dist/static/js/${mainFile}`), 'utf8'),
    ).toContain('children:"helloworld"');
  });

  it('should not exit unexpectly when transform failed', async () => {
    const appDir = path.resolve(fixtures, 'transform-fail');

    const cp: ChildProcess = await runModernCommandDev(['dev'], false, {
      cwd: appDir,
      env: {
        NODE_ENV: 'development',
      },
    });

    expect(cp).toBeDefined();
    expect(cp.exitCode).toBe(null);

    cp.kill('SIGTERM');
  });
});
