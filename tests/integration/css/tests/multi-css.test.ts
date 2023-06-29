import path from 'path';
import { fs } from '@modern-js/utils';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getCssFiles } from './utils';

describe('multi page css', () => {
  test('should emitted multiple css files', async () => {
    const appDir = path.resolve(fixtures, 'multi-css');

    await modernBuild(appDir);

    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(3);

    expect(
      fs.readFileSync(
        path.resolve(
          appDir,
          `dist/static/css/${cssFiles.find(f => f.startsWith('entry1'))}`,
        ),
        'utf8',
      ),
    ).toContain('#entry1{color:red}');

    // css-nano colormin optimization
    expect(
      fs.readFileSync(
        path.resolve(
          appDir,
          `dist/static/css/${cssFiles.find(f => f.startsWith('entry2'))}`,
        ),
        'utf8',
      ),
    ).toContain('#entry2{color:blue}');

    expect(
      fs.readFileSync(
        path.resolve(
          appDir,
          `dist/static/css/${cssFiles.find(f => f.startsWith('entry3'))}`,
        ),
        'utf8',
      ),
    ).toContain('#entry3{color:#ff0}');
  });
});
