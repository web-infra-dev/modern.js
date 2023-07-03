import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getCssFiles, readCssFile } from './utils';

describe('import common css', () => {
  test('should emitted single css file with merged styles', async () => {
    const appDir = path.resolve(fixtures, 'import-common-css');

    await modernBuild(appDir);

    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(1);

    expect(readCssFile(appDir, cssFiles[0])).toContain(
      'html{min-height:100%}#a{color:red}#b{color:blue}',
    );
  });
});
