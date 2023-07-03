import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getCssFiles, getPreCssFiles } from './utils';

jest.setTimeout(1000 * 60 * 2);

describe('test pre-css exclude sass util', () => {
  test(`should exclude specified sass file`, async () => {
    const appDir = path.resolve(fixtures, 'exclude-sass');

    await modernBuild(appDir);

    const sassFiles = getPreCssFiles(appDir, 'scss');

    const cssFiles = getCssFiles(appDir);

    expect(sassFiles.length).toBe(1);

    expect(cssFiles.length).toBe(1);
  });
});
