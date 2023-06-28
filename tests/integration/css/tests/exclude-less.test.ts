import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getCssFiles, getPreCssFiles } from './utils';

jest.setTimeout(1000 * 60 * 2);

describe('test pre-css exclude less util', () => {
  test(`should exclude specified less file`, async () => {
    const appDir = path.resolve(fixtures, 'exclude-less');

    await modernBuild(appDir);

    const lessFiles = getPreCssFiles(appDir, 'less');

    const cssFiles = getCssFiles(appDir);

    expect(lessFiles.length).toBe(1);

    expect(cssFiles.length).toBe(1);
  });
});
