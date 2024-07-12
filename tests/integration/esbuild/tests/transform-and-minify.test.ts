import path from 'path';
import { readFileSync, rmdirSync, existsSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getJsFiles } from './utils';

describe('esbuild', () => {
  test(`should emitted script files correctly when using esbuild transform`, async () => {
    const appDir = path.resolve(fixtures, 'transform-and-minify');
    if (existsSync(path.join(appDir, 'dist'))) {
      rmdirSync(path.join(appDir, 'dist'), { recursive: true });
    }
    await modernBuild(appDir);

    const files = getJsFiles(appDir);
    const mainFile = files.filter(filepath => filepath.startsWith('main'))[0];

    expect(files.length).toBe(3);
    expect(
      readFileSync(path.resolve(appDir, `dist/static/js/${mainFile}`), 'utf8'),
    ).toContain('children:"helloworld"');
  });
});
