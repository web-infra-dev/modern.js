import path from 'path';
import { readFileSync, readdirSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

const getJsFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/js'))
    .filter(filepath => /\.js$/.test(filepath))
    .map(filePath =>
      readFileSync(path.join(appDir, 'dist/static/js', filePath)),
    );

describe('swc use new decorator', () => {
  test('should use new decorator', async () => {
    const appDir = path.resolve(fixtures, 'decorator/new');

    await modernBuild(appDir);

    const jsFiles = getJsFiles(appDir);
    expect(
      jsFiles.some(item => item.includes('@swc/helpers/esm/_decorate.js')),
    ).toBeTruthy();
  });

  test('should use legacy decorator', async () => {
    const appDir = path.resolve(fixtures, 'decorator/legacy');

    await modernBuild(appDir);

    const jsFiles = getJsFiles(appDir);
    expect(jsFiles.some(item => item.includes('_ts_decorate'))).toBeTruthy();
  });
});
