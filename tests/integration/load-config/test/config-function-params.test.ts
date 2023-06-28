import path from 'path';
import { readFileSync } from 'fs';
import {
  killApp,
  launchApp,
  modernBuild,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

const appDir = path.resolve(fixtures, 'config-function-params');

describe('local config', () => {
  it(`should passing correct config params when running dev command`, async () => {
    const app = await launchApp(appDir);
    const rawParams = readFileSync(
      path.join(appDir, 'dist/params.json'),
      'utf-8',
    );
    expect(JSON.parse(rawParams)).toEqual({
      env: 'development',
      command: 'dev',
    });
    await killApp(app);
  });

  it(`should passing correct config params when running build command`, async () => {
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
});
