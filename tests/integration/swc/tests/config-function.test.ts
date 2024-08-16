import path from 'path';
import { readdirSync, readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

const getCssFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/css')).filter(filepath =>
    /\.css$/.test(filepath),
  );

describe('should apply swc function config correctly', () => {
  test('should not minify css', async () => {
    const appDir = path.resolve(fixtures, 'config-function');

    await modernBuild(appDir);

    const cssFile = getCssFiles(appDir)[0];
    const content = readFileSync(
      path.resolve(appDir, `dist/static/css/${cssFile}`),
      'utf8',
    );
    expect(content).toContain('@charset "UTF-8";');
    expect(content).toContain(':root');
    expect(content).not.toContain('@charset "UTF-8";:root');
  });
});
