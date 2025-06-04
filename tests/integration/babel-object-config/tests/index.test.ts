import fs from 'fs';
import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

function existsSync(filePath: string) {
  return fs.existsSync(path.join(appDir, 'dist', filePath));
}

describe('babel object config', () => {
  test(`should build successfully`, async () => {
    const res = await modernBuild(appDir);

    expect(
      res.stdout.includes('Error: Duplicate plugin/preset detected.'),
    ).toBe(false);

    expect(existsSync('html/main/index.html')).toBe(true);
  });
});
