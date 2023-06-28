import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getCssFiles, readCssFile } from './utils';

describe('base less support', () => {
  test(`should emitted multi css file`, async () => {
    const appDir = path.resolve(fixtures, 'multi-less');

    await modernBuild(appDir);

    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(2);

    expect(
      readCssFile(
        appDir,
        cssFiles.find(name => /a\.[a-z\d]+\.css$/.test(name))!,
      ),
    ).toContain('#a{width:10px}');

    expect(
      readCssFile(
        appDir,
        cssFiles.find(name => /b\.[a-z\d]+\.css$/.test(name))!,
      ),
    ).toContain('#b{height:20px}');
  });
});
