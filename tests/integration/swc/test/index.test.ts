import path from 'path';
import { readdirSync, readFileSync } from 'fs';
import type { ChildProcess } from 'child_process';
import getPort from 'get-port';
import {
  modernBuild,
  runModernCommandDev,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

const getJsFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/js')).filter(filepath =>
    /\.js$/.test(filepath),
  );

const getCssFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/css')).filter(filepath =>
    /\.css$/.test(filepath),
  );

describe('swc minify', () => {
  it('should emitted script files correctly', async () => {
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

  it('should minify css', async () => {
    const appDir = path.resolve(fixtures, 'minify-css');

    await modernBuild(appDir);

    const cssFile = getCssFiles(appDir)[0];
    const content = readFileSync(
      path.resolve(appDir, `dist/static/css/${cssFile}`),
      'utf8',
    );
    expect(content).toContain(
      '@charset "UTF-8";:root{--bs-blue:#0d6efd;--bs-indigo:#6610f2;',
    );
  });
});
