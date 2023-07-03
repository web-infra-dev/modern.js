import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { copyModules, fixtures, getCssFiles, readCssFile } from './utils';

describe('base import css', () => {
  // https://github.com/webpack-contrib/css-loader/blob/master/CHANGELOG.md#bug-fixes-6
  test('should compile successfully', async () => {
    const appDir = path.resolve(fixtures, 'bad-npm-import');

    copyModules(appDir);

    await modernBuild(appDir);
    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(1);

    const main = cssFiles.filter(fileName =>
      /main\.[a-z\d]+\.css$/.test(fileName),
    );

    expect(readCssFile(appDir, main[0])).toContain(
      `body{width:100%}html{min-height:100%}`,
    );
  });
});
