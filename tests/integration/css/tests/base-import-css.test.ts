import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';
import { fixtures, getCssFiles, getCssMaps, readCssFile } from './utils';

const appDir = path.resolve(fixtures, 'base-import');

describe('base import css', () => {
  beforeAll(async () => {
    await modernBuild(appDir);
  });

  test('should emitted single css file ', async () => {
    const cssFiles = getCssFiles(appDir);

    expect(cssFiles.length).toBe(1);

    expect(readCssFile(appDir, cssFiles[0])).toContain(
      'body{color:#dcdcdc}#demo{font-size:18px}',
    );
  });

  test('should generate source map', async () => {
    const cssMaps = getCssMaps(appDir);

    expect(cssMaps.length).toBe(1);
  });
});
