import path from 'path';
import { readFileSync, rmdirSync, existsSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getJsFiles } from './utils';

describe('esbuild', () => {
  it(`should emitted script files correctly when using legacy esbuild minify`, async () => {
    const appDir = path.resolve(fixtures, 'legacy-minify-js');
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
