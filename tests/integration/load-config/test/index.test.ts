import path from 'path';
import { existsSync, readFileSync } from 'fs';
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

  it(`should load local config in function format correctly`, async () => {
    const appDir = path.resolve(fixtures, 'local-config-function');
    const app = await launchApp(appDir);

    expect(
      existsSync(path.join(appDir, 'dist/bar/html/main/index.html')),
    ).toBeTruthy();

    killApp(app);
  });

  it(`should passing correct config params when running dev command`, async () => {
    const appDir = path.resolve(fixtures, 'config-function-params');
    const app = await launchApp(appDir);

    const rawParams = readFileSync(
      path.join(appDir, 'dist/params.json'),
      'utf-8',
    );
    expect(JSON.parse(rawParams)).toEqual({
      env: 'development',
      command: 'dev',
    });

    killApp(app);
  });

  it(`should passing correct config params when running build command`, async () => {
    const appDir = path.resolve(fixtures, 'config-function-params');
    await modernBuild(appDir);

    const rawParams = readFileSync(
      path.join(appDir, 'dist/params.json'),
      'utf-8',
    );
    expect(JSON.parse(rawParams)).toEqual({
      env: 'production',
      command: 'build',
    });
  });

  it(`should allow config file to export an async function`, async () => {
    const appDir = path.resolve(fixtures, 'async-config-function');
    await modernBuild(appDir);

    expect(
      existsSync(path.join(appDir, 'dist/foo/html/main/index.html')),
    ).toBeTruthy();
  });
});
