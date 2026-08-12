import path, { join } from 'path';
import { fs } from '@modern-js/utils';
import {
  createIsolatedTestApp,
  modernBuild,
} from '../../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 2, hookTimeout: 1000 * 60 * 2 });

const sourceDir = path.resolve(__dirname, '..');
let appDir: string;
let cleanupApp: (() => Promise<void>) | undefined;

beforeAll(async () => {
  // Each test file runs against its own copy of the fixture: the dev server
  // lock rejects concurrent dev/build in one directory, and parallel test
  // files used to share (and silently corrupt) this one.
  const isolated = await createIsolatedTestApp(sourceDir);
  appDir = isolated.appDir;
  cleanupApp = isolated.cleanup;
});

afterAll(async () => {
  await cleanupApp?.();
});

describe('ssg', () => {
  test('should simple ssg work correctly', async () => {
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
