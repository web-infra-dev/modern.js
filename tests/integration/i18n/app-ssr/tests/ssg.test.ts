import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import { modernBuild } from '../../../../utils/modernTestUtils';

const projectDir = path.resolve(__dirname, '..');

jest.setTimeout(1000 * 60 * 2);

describe('ssg', () => {
  test('should simple ssg work correctly', async () => {
    const appDir = projectDir;
    await modernBuild(appDir, ['--config', 'modern.ssg.config.ts']);

    const zhHtmlPath = path.join(appDir, './dist/html/main/zh/index.html');
    const enHtmlPath = path.join(appDir, './dist/html/main/en/index.html');
    const zhContent = fs.readFileSync(zhHtmlPath, 'utf-8');
    const enContent = fs.readFileSync(enHtmlPath, 'utf-8');
    expect(zhContent).toMatch('你好，世界');
    expect(enContent).toMatch('Hello World');
  });
});
