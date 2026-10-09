import dns from 'node:dns';
import path from 'path';
import { fs as fse } from '@modern-js/utils';
import {
  createIsolatedTestApp,
  getPort,
  killApp,
  launchApp,
  modernBuild,
  modernServe,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 3, hookTimeout: 1000 * 60 * 3 });

dns.setDefaultResultOrder('ipv4first');

const sourceAppDir = path.resolve(__dirname, '../');
const FALLBACK_WARNING = 'add a tsconfig.server.json';

const readDist = (appDir: string, file: string) =>
  fse.readFile(path.join(appDir, 'dist', file), 'utf-8');

// The emitted server code must be plain CommonJS that Node can `require()`:
// the project is `type: commonjs` even though `tsconfig.json` is bundler-mode.
const expectCommonJsOutput = async (appDir: string) => {
  const lambdaHello = await readDist(appDir, 'api/lambda/hello.js');
  expect(lambdaHello).toContain('exports.');
  expect(lambdaHello).toContain('require(');
  expect(lambdaHello).not.toMatch(/^import /m);
  expect(lambdaHello).not.toMatch(/^export /m);
  // `@shared/*` is rewritten to a relative specifier.
  expect(lambdaHello).toContain('../../shared/greeting');
  expect(lambdaHello).not.toContain('@shared/');

  const lambdaUser = await readDist(appDir, 'api/lambda/user.js');
  // `@api/*` (-> api/lambda/*) is rewritten too.
  expect(lambdaUser).toMatch(/require\(["']\.\/hello["']\)/);
  expect(lambdaUser).not.toContain('@api/');

  const serverEntry = await readDist(appDir, 'server/modern.server.js');
  expect(serverEntry).toContain('exports.');
  expect(serverEntry).toContain('../shared/greeting');
  expect(serverEntry).not.toContain('@shared/');
  expect(serverEntry).not.toMatch(/^import /m);

  // The strongest check: Node itself loads the emitted files.
  const hello = require(path.join(appDir, 'dist/api/lambda/hello.js'));
  expect(await hello.default()).toEqual({ message: 'hello bff' });
  const user = require(path.join(appDir, 'dist/api/lambda/user.js'));
  expect(await user.default()).toEqual({
    user: 'modern',
    message: 'hello bff',
  });
  const server = require(path.join(appDir, 'dist/server/modern.server.js'));
  expect(server.default).toBeDefined();
};

describe('server tsconfig fallback (bundler-mode tsconfig.json, commonjs project)', () => {
  describe('without tsconfig.server.json', () => {
    let buildResult: { code: number; stdout: string; stderr: string };

    beforeAll(async () => {
      await fse.remove(path.join(sourceAppDir, 'dist'));
      buildResult = await modernBuild(sourceAppDir, [], {});
    });

    afterAll(async () => {
      await fse.remove(path.join(sourceAppDir, 'dist'));
    });

    it('builds successfully', () => {
      expect(buildResult.code).toBe(0);
    });

    it('emits commonjs with aliases rewritten', async () => {
      await expectCommonJsOutput(sourceAppDir);
    });

    it('warns once and suggests tsconfig.server.json', () => {
      const output = `${buildResult.stdout}\n${buildResult.stderr}`;
      expect(output).toContain(FALLBACK_WARNING);
      expect(output.split(FALLBACK_WARNING).length - 1).toBe(1);
    });

    it('serves the bff and the custom server from the compiled output', async () => {
      const port = await getPort();
      const app = await modernServe(sourceAppDir, port);

      try {
        const res = await fetch(`http://localhost:${port}/api/hello`);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ message: 'hello bff' });
        expect(res.headers.get('x-greeting')).toBe('hello server');

        const user = await fetch(`http://localhost:${port}/api/user`);
        expect(user.status).toBe(200);
        expect(await user.json()).toEqual({
          user: 'modern',
          message: 'hello bff',
        });
      } finally {
        await killApp(app);
      }
    });

    it('runs the custom server from source under ts-node in dev', async () => {
      // In dev the framework registers ts-node with the same NodeNext
      // override, otherwise `require('./server/modern.server.ts')` would see
      // ESM output in a commonjs project.
      const { appDir, cleanup } = await createIsolatedTestApp(sourceAppDir);
      const port = await getPort();
      let app: any;

      try {
        app = await launchApp(appDir, port, {}, {});
        const res = await fetch(`http://localhost:${port}/api/hello`);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ message: 'hello bff' });
        expect(res.headers.get('x-greeting')).toBe('hello server');
      } finally {
        if (app) {
          await killApp(app);
        }
        await cleanup();
      }
    });
  });

  describe('with tsconfig.server.json (convention)', () => {
    let appDir: string;
    let cleanup: () => Promise<void>;
    let buildResult: { code: number; stdout: string; stderr: string };

    beforeAll(async () => {
      // Build a copy so the two cases never share a `dist`.
      ({ appDir, cleanup } = await createIsolatedTestApp(sourceAppDir));
      await fse.writeJSON(
        path.join(appDir, 'tsconfig.server.json'),
        {
          extends: './tsconfig.json',
          compilerOptions: {
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            noEmit: false,
            declaration: false,
          },
          include: ['api', 'server', 'shared'],
        },
        { spaces: 2 },
      );
      buildResult = await modernBuild(appDir, [], {});
    });

    afterAll(async () => {
      await cleanup();
    });

    it('builds successfully', () => {
      expect(buildResult.code).toBe(0);
    });

    it('emits commonjs with aliases inherited from tsconfig.json', async () => {
      await expectCommonJsOutput(appDir);
    });

    it('does not warn', () => {
      const output = `${buildResult.stdout}\n${buildResult.stderr}`;
      expect(output).not.toContain(FALLBACK_WARNING);
    });
  });
});
