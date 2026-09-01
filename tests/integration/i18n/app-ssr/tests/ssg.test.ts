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

    const zhHtmlPath = path.join(appDir, './dist-ssg/html/index/zh/index.html');
    const enHtmlPath = path.join(appDir, './dist-ssg/html/index/en/index.html');
    const zhContent = fs.readFileSync(zhHtmlPath, 'utf-8');
    const enContent = fs.readFileSync(enHtmlPath, 'utf-8');
    expect(zhContent).toMatch('你好，世界');
    expect(enContent).toMatch('Hello World');
  });
});
