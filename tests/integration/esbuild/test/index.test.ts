import path from 'path';
import { readdirSync, readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

const getJsFiles = (appDir: string) =>
  readdirSync(path.resolve(appDir, 'dist/static/js')).filter(filepath =>
    /\.js$/.test(filepath),
  );

describe('esbuild minify', () => {
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
});
