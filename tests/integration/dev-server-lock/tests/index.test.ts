import path from 'path';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchApp,
  modernBuild,
  modernBuildWatch,
  runModernCommandDev,
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

  test('--allow-multiple lets a second dev coexist (dev and the start alias), but build stays rejected', async () => {
    const { appDir, cleanup } = await createIsolatedTestApp(sourceDir);
    let app: any;
    let second: any;
    try {
      app = await launchApp(appDir, await getPort());

      // `start` is the dev alias and shares its options: the second server
      // must boot on an auto-incremented port instead of being rejected.
      second = await runModernCommandDev(
        ['start', '--allow-multiple'],
        undefined,
        {
          cwd: appDir,
          env: { PORT: await getPort(), NODE_ENV: 'development' },
        },
      );
      expect(second).toBeTruthy();

      // The flag only relaxes dev↔dev: an exclusive command is still blocked.
      const blocked = await modernBuild(appDir, [], { allowFailure: true });
      expect(blocked.code).not.toBe(0);
      expect(`${blocked.stdout}${blocked.stderr}`).toMatch(
        /EBUILD_BLOCKED_BY_DEV/,
      );
    } finally {
      if (second) {
        await killApp(second, true);
      }
      if (app) {
        await killApp(app, true);
      }
      await cleanup();
    }
  });

  test('build --watch holds the exclusive lock until the watcher stops', async () => {
    const { appDir, cleanup } = await createIsolatedTestApp(sourceDir);
    let watcher: any;
    let app: any;
    try {
      watcher = await modernBuildWatch(appDir);

      const err = await launchApp(appDir, await getPort()).then(
        () => {
          throw new Error('dev should have been rejected during build --watch');
        },
        rejection => rejection as Error,
      );
      expect(String(err.message)).toMatch(/EDEV_BLOCKED_BY_BUILD/);

      await killApp(watcher);
      watcher = undefined;

      app = await launchApp(appDir, await getPort());
      expect(app).toBeTruthy();
    } finally {
      if (watcher) {
        await killApp(watcher, true);
      }
      if (app) {
        await killApp(app, true);
      }
      await cleanup();
    }
  });
});
