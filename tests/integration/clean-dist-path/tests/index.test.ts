import path from 'path';
import { fs } from '@modern-js/utils';
import { modernBuild } from '../../../utils/modernTestUtils';

describe('clean dist path', () => {
  test(`should not clean dist path when output.cleanDistPath is false`, async () => {
    const appDir = path.resolve(__dirname, '..');
    const tempFile = path.join(appDir, 'dist/foo.txt');
    const htmlFile = path.join(appDir, 'dist/html/main/index.html');
    fs.outputFileSync(tempFile, 'foo');
    await modernBuild(appDir);
    expect(fs.existsSync(tempFile)).toBeTruthy();
    expect(fs.existsSync(htmlFile)).toBeTruthy();
  });
});
