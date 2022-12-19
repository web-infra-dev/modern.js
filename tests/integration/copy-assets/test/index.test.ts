import path from 'path';
import { readFileSync } from 'fs';
import { modernBuild } from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');

describe('copy assets', () => {
  it(`should copy public html and replace the assetPrefix variable`, async () => {
    const appDir = path.resolve(fixtures, 'copy-public-html');

    await modernBuild(appDir);

    const copiedHTML = readFileSync(
      path.join(appDir, 'dist/public/demo.html'),
      'utf-8',
    );
    expect(copiedHTML).toMatchSnapshot();
  });
});
