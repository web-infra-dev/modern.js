import { spawn, type ChildProcess } from 'node:child_process';
import { connect } from 'node:net';
import path from 'node:path';
import {
  fs,
  LOADABLE_STATS_FILE,
  NESTED_ROUTE_SPEC_FILE,
  ROUTE_MANIFEST_FILE,
} from '@modern-js/utils';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  modernBuild,
} from '../../../utils/modernTestUtils';

const fixtures = path.resolve(__dirname, '../fixtures');
const modernBin = path.resolve(
  __dirname,
  '../../../node_modules/@modern-js/app-tools/bin/modern.js',
);
const originalError = 'RouteModuleLoadError: SSR_ROUTE_MODULE_INIT_FAILED';
let builtApp: string;
let renderRelativePath: string;
let loaderRelativePath: string;
let cleanupBuild: (() => Promise<void>) | undefined;

beforeAll(async () => {
  const isolated = await createIsolatedTestApp(path.join(fixtures, 'base'));
  builtApp = isolated.appDir;
  cleanupBuild = isolated.cleanup;
  await fs.copy(
    path.join(fixtures, 'route-module-error/module-error'),
    path.join(builtApp, 'src/routes/module-error'),
  );
  const result = await modernBuild(builtApp);
  expect(result.code, `${result.stdout}\n${result.stderr}`).toBe(0);
  const { routes } = await fs.readJSON(path.join(builtApp, 'dist/route.json'));
  const rootRoute = routes.find(
    (route: { urlPath: string; bundle?: string }) =>
      route.urlPath === '/' && route.bundle,
  );
  expect(rootRoute).toBeTruthy();
  renderRelativePath = rootRoute.bundle;
  loaderRelativePath = `bundles/${rootRoute.entryName}-server-loaders.js`;
  expect(
    await fs.pathExists(path.join(builtApp, 'dist', renderRelativePath)),
  ).toBe(true);
  expect(
    await fs.pathExists(path.join(builtApp, 'dist', loaderRelativePath)),
  ).toBe(true);
});

afterAll(async () => {
  await cleanupBuild?.();
});

async function isolatedBuild() {
  const isolated = await createIsolatedTestApp(builtApp, {
    prefix: '.isolated-startup-',
  });
  try {
    await fs.copy(
      path.join(builtApp, 'dist'),
      path.join(isolated.appDir, 'dist'),
    );
    return isolated;
  } catch (error) {
    await isolated.cleanup();
    throw error;
  }
}

function startServe(appDir: string, port: number) {
  let output = '';
  const app = spawn(process.execPath, [modernBin, 'serve'], {
    cwd: appDir,
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port) },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  app.stdout.on('data', chunk => {
    output += chunk.toString();
  });
  app.stderr.on('data', chunk => {
    output += chunk.toString();
  });
  const closed = new Promise<number | null>((resolve, reject) => {
    app.once('error', reject);
    app.once('close', resolve);
  });
  return { app, closed, output: () => output };
}

async function stopServe(app?: ChildProcess) {
  if (app && app.exitCode === null && app.signalCode === null) {
    await killApp(app, true);
  }
}

async function isListening(port: number) {
  return new Promise<boolean>(resolve => {
    const socket = connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

describe('Node production SSR startup warmup', () => {
  test.each([
    ['missing entry', undefined, 'Cannot find module'],
    [
      'missing entry dependency',
      "require('./missing-warmup-dependency.cjs');",
      'missing-warmup-dependency.cjs',
    ],
    [
      'entry initialization failure',
      "const e = new Error('SSR_ENTRY_INIT_FAILED'); e.name = 'StartupModuleError'; throw e;",
      'StartupModuleError: SSR_ENTRY_INIT_FAILED',
    ],
    [
      'loader initialization failure',
      "require('./missing-loader-dependency.cjs');",
      'missing-loader-dependency.cjs',
    ],
    [
      'loader loadModules failure',
      "module.exports = { loadModules: async () => { throw new Error('SSR_LOAD_MODULES_FAILED'); } };",
      'Error: SSR_LOAD_MODULES_FAILED',
    ],
  ] as const)(
    'fails before any request on %s, preserving the original error',
    async (failure, code, expectedError) => {
      const isolated = await isolatedBuild();
      let child: ReturnType<typeof startServe> | undefined;
      try {
        const target = path.join(
          isolated.appDir,
          'dist',
          failure.startsWith('loader')
            ? loaderRelativePath
            : renderRelativePath,
        );
        expect(await fs.pathExists(target)).toBe(true);
        if (code === undefined) {
          await fs.remove(target);
        } else {
          await fs.writeFile(target, code);
        }
        const port = await getPort();
        child = startServe(isolated.appDir, port);
        await expect
          .poll(() => child!.app.exitCode, { timeout: 15_000 })
          .not.toBeNull();
        expect(await child.closed, child.output()).toBe(1);
        expect(child.output()).toContain(expectedError);
        expect(child.output()).toContain(target);
        expect(child.output()).not.toMatch(/> Local:/i);
        expect(await isListening(port)).toBe(false);
      } finally {
        await stopServe(child?.app);
        await isolated.cleanup();
      }
    },
  );

  test.each(['success', 'failure'])(
    'does not listen before delayed loader warmup finishes with %s',
    async outcome => {
      const isolated = await isolatedBuild();
      let child: ReturnType<typeof startServe> | undefined;
      try {
        const loader = path.join(isolated.appDir, 'dist', loaderRelativePath);
        const originalName = `${path.basename(loader, '.js')}.original.cjs`;
        await fs.rename(loader, path.join(path.dirname(loader), originalName));
        await fs.writeFile(
          loader,
          `module.exports = { async loadModules() {
          console.log('SSR_WARMUP_WAITING');
          await new Promise(resolve => process.stdin.once('data', resolve));
          ${outcome === 'failure' ? "throw new Error('SSR_DELAYED_WARMUP_FAILED');" : ''}
          const bundle = require('./${originalName}');
          return bundle.loadModules ? await bundle.loadModules() : bundle;
        } };`,
        );
        const port = await getPort();
        child = startServe(isolated.appDir, port);
        await expect
          .poll(() => child!.output(), { timeout: 15_000 })
          .toContain('SSR_WARMUP_WAITING');
        expect(child.output()).not.toMatch(/> Local:/i);
        expect(await isListening(port)).toBe(false);
        child.app.stdin!.write('continue\n');
        if (outcome === 'failure') {
          await expect
            .poll(() => child!.app.exitCode, { timeout: 15_000 })
            .not.toBeNull();
          expect(await child.closed, child.output()).toBe(1);
          expect(child.output()).toContain('Error: SSR_DELAYED_WARMUP_FAILED');
          expect(child.output()).not.toMatch(/> Local:/i);
          expect(await isListening(port)).toBe(false);
          return;
        }
        await expect
          .poll(() => child!.output(), { timeout: 15_000 })
          .toMatch(/> Local:/i);
        const response = await fetch(
          `http://localhost:${port}/user/1?no-cache=1`,
        );
        expect(response.status).toBe(200);
        const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, '');
        expect(html).toContain('user1-18');
      } finally {
        await stopServe(child?.app);
        await isolated.cleanup();
      }
    },
  );

  test('starts when optional loader bundles and manifests are absent', async () => {
    const isolated = await isolatedBuild();
    let child: ReturnType<typeof startServe> | undefined;
    try {
      for (const file of [
        loaderRelativePath,
        LOADABLE_STATS_FILE,
        NESTED_ROUTE_SPEC_FILE,
        ROUTE_MANIFEST_FILE,
      ]) {
        await fs.remove(path.join(isolated.appDir, 'dist', file));
      }
      child = startServe(isolated.appDir, await getPort());
      await expect
        .poll(() => child!.output(), { timeout: 15_000 })
        .toMatch(/> Local:/i);
      expect(child.app.exitCode).toBeNull();
      expect(child.output()).not.toContain('bundle failed');
    } finally {
      await stopServe(child?.app);
      await isolated.cleanup();
    }
  });

  test('leaves lazy modules to request-time loading with original SSR errors', async () => {
    const isolated = await isolatedBuild();
    let child: ReturnType<typeof startServe> | undefined;
    try {
      const port = await getPort();
      child = startServe(isolated.appDir, port);
      await expect
        .poll(() => child!.output(), { timeout: 15_000 })
        .toMatch(/> Local:/i);
      expect(child.output()).not.toContain('SSR_ROUTE_MODULE_INIT_FAILED');
      for (let attempt = 0; attempt < 2; attempt++) {
        const start = child.output().length;
        const response = await fetch(
          `http://localhost:${port}/module-error?no-cache=1`,
        );
        await response.text();
        expect(response.status).toBe(200);
        await expect
          .poll(() => child!.output().slice(start))
          .toContain(originalError);
      }
      const response = await fetch(
        `http://localhost:${port}/user/1?no-cache=1`,
      );
      expect(response.status).toBe(200);
      const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, '');
      expect(html).toContain('user1-18');
    } finally {
      await stopServe(child?.app);
      await isolated.cleanup();
    }
  });
});
