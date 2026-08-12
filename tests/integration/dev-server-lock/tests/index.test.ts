import path from 'path';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchApp,
  modernBuild,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 3, hookTimeout: 1000 * 60 * 3 });

const sourceDir = path.resolve(__dirname, '..');

describe('dev server lock', () => {
  test('build is rejected while a dev server holds the lock, and succeeds after it stops', async () => {
    const { appDir, cleanup } = await createIsolatedTestApp(sourceDir);
    let app: any;
    try {
      app = await launchApp(appDir, await getPort());

      const blocked = await modernBuild(appDir, [], { allowFailure: true });
      expect(blocked.code).not.toBe(0);
      expect(`${blocked.stdout}${blocked.stderr}`).toMatch(
        /EBUILD_BLOCKED_BY_DEV/,
      );

      await killApp(app);
      app = undefined;

      const ok = await modernBuild(appDir);
      expect(ok.code).toBe(0);
    } finally {
      if (app) {
        await killApp(app, true);
      }
      await cleanup();
    }
  });

  test('a second dev in the same directory is rejected with the running instance info', async () => {
    const { appDir, cleanup } = await createIsolatedTestApp(sourceDir);
    let app: any;
    try {
      app = await launchApp(appDir, await getPort());

      const err = await launchApp(appDir, await getPort()).then(
        () => {
          throw new Error('the second dev server should have been rejected');
        },
        rejection => rejection as Error,
      );
      expect(String(err.message)).toMatch(/EDEV_SERVER_RUNNING/);
    } finally {
      if (app) {
        await killApp(app, true);
      }
      await cleanup();
    }
  });

  test('isolated copies of the same fixture run dev and build in parallel', async () => {
    const first = await createIsolatedTestApp(sourceDir);
    const second = await createIsolatedTestApp(sourceDir);
    let app: any;
    try {
      const [devApp, buildResult] = await Promise.all([
        launchApp(first.appDir, await getPort()),
        modernBuild(second.appDir),
      ]);
      app = devApp;
      expect(buildResult.code).toBe(0);
    } finally {
      if (app) {
        await killApp(app, true);
      }
      await first.cleanup();
      await second.cleanup();
    }
  });
});
