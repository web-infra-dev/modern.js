import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { copyModules, fixtures, getCssFiles } from './utils';

describe('less import', () => {
  // less code split 和 css 有区别, node_modules 中 css 会单独提出一个 chunk， less 不会~
  // 现在 css 也不会了
  test(`should import less successfully from node_modules`, async () => {
    const appDir = path.resolve(fixtures, 'less-npm-import');

    copyModules(appDir);

    await modernBuild(appDir);

    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(1);
  });
});
