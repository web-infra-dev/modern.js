import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getCssFiles } from './utils';

describe('less import', () => {
  test('should emitted single css file', async () => {
    const appDir = path.resolve(fixtures, 'less-import');

    await modernBuild(appDir);

    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(1);
  });
});
