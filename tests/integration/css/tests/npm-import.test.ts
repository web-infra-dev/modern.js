import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { copyModules, fixtures, getCssFiles, readCssFile } from './utils';

describe('import css from node_modules', () => {
  test('should emitted single css file', async () => {
    const appDir = path.resolve(fixtures, 'npm-import');

    copyModules(appDir);

    await modernBuild(appDir);

    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(1);

    const main = cssFiles.filter(fileName =>
      /main\.[a-z\d]+\.css$/.test(fileName),
    );

    expect(readCssFile(appDir, main[0])).toContain(
      'body{color:#ff0;width:960px}html{min-height:100%}',
    );
  });
});
