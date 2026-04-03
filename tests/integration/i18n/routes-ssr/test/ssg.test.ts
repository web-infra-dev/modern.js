import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import { modernBuild } from '../../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 2, hookTimeout: 1000 * 60 * 2 });

const projectDir = path.resolve(__dirname, '..');

describe('ssg', () => {
  test('should simple ssg work correctly', async () => {
    const appDir = projectDir;
    await modernBuild(appDir, ['--config', 'modern.ssg.config.ts']);

    const zhAboutHtmlPath = path.join(
      appDir,
      './dist-ssg/html/index/zh/about/index.html',
    );
    const enAboutHtmlPath = path.join(
      appDir,
      './dist-ssg/html/index/en/about/index.html',
    );
    const zhAboutContent = fs.readFileSync(zhAboutHtmlPath, 'utf-8');
    const enAboutContent = fs.readFileSync(enAboutHtmlPath, 'utf-8');
    expect(zhAboutContent).toMatch('关于');
    expect(enAboutContent).toMatch('About');
  });
});
