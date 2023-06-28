import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';

import { fixtures, getCssFiles, readCssFile } from './utils';

describe('default less loader options', () => {
  test(`should inline javascript by default`, async () => {
    const appDir = path.resolve(fixtures, 'less-inline-js');

    await modernBuild(appDir);
    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(1);

    expect(readCssFile(appDir, cssFiles[0])).toContain('body{width:200}');
  });
});
