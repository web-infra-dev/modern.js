import path from 'path';
import { writeFileSync, existsSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

describe('clean dist path', () => {
  it(`should not clean dist path when output.cleanDistPath is false`, async () => {
    const appDir = path.resolve(__dirname, '..');
    const tempFile = path.join(appDir, 'dist', 'foo.txt');
    writeFileSync(tempFile, 'foo');
    await modernBuild(appDir);
    expect(existsSync(tempFile)).toBeTruthy();
  });
});
