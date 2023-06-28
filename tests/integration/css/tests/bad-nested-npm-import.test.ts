import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { copyModules, fixtures, getCssFiles, readCssFile } from './utils';

describe('nested import css from node_modules', () => {
  test('should compile successfully', async () => {
    const appDir = path.resolve(fixtures, './bad-nested-npm-import');

    copyModules(appDir);

    await modernBuild(appDir);
    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(1);

    const main = cssFiles.filter(fileName =>
      /main\.[a-z\d]+\.css$/.test(fileName),
    );

    expect(readCssFile(appDir, main[0])).toContain(
      `#b{color:#ff0}#a{font-size:10px}html{font-size:18px}`,
    );
  });
});
