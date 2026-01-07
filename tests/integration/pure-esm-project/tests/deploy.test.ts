import path from 'path';
import { execa, fs as fse, isVersionAtLeast1819 } from '@modern-js/utils';

const appDir = path.resolve(__dirname, '../');

if (isVersionAtLeast1819()) {
  describe('deploy', () => {
    afterEach(async () => {
      // local test will copy some lib files to /compiled, this is a mistake, we will manually delete it temporarily.
      await fse.remove(path.join(appDir, 'compiled'));
    });

    afterAll(async () => {
      await fse.remove(path.join(appDir, '.ali-esa'));
      await fse.remove(path.join(appDir, '.eo-output'));
      await fse.remove(path.join(appDir, '.cf-workers'));
      await fse.remove(path.join(appDir, '.vercel'));
      await fse.remove(path.join(appDir, '.netlify'));
      await fse.remove(path.join(appDir, '.output'));
      await fse.remove(path.join(appDir, '.dist-cf'));
      await fse.remove(path.join(appDir, '.dist-eo'));
    });

    test('pure-esm-project deploy target is node', async () => {
      await execa('npx modern deploy', {
        shell: true,
        cwd: appDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          MODERNJS_DEPLOY: 'node',
          MODERN_DIST_ROOT: 'dist-deploy',
        },
      });
      const outputDirectory = path.join(appDir, '.output');
      const staticDirectory = path.join(outputDirectory, 'static');
      const htmlDirectory = path.join(outputDirectory, 'html');
      const apiFile = path.join(outputDirectory, 'api/lambda/index.js');
      const cjsBootstrapPath = path.join(outputDirectory, 'index.cjs');
      const bootstrapPath = path.join(outputDirectory, 'index.js');

      expect(await fse.pathExists(staticDirectory)).toBe(true);
      expect(await fse.pathExists(htmlDirectory)).toBe(true);
      expect(await fse.pathExists(apiFile)).toBe(true);
      expect(await fse.pathExists(cjsBootstrapPath)).toBe(true);
      expect(await fse.pathExists(bootstrapPath)).toBe(true);
    });

    test('pure-esm-project deploy target is cfWorkers', async () => {
      await execa('npx modern deploy', {
        shell: true,
        cwd: appDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          MODERNJS_DEPLOY: 'cfWorkers',
          MODERN_DIST_ROOT: 'dist-cf',
        },
      });

      const outputDirectory = path.join(appDir, '.cf-workers');
      const staticDirectory = path.join(outputDirectory, 'assets/static');
      const handlerFile = path.join(outputDirectory, 'functions/handler.js');

      expect(await fse.pathExists(staticDirectory)).toBe(true);
      expect(await fse.pathExists(handlerFile)).toBe(true);
    });

    test('pure-esm-project deploy target is edgeone', async () => {
      await execa('npx modern deploy', {
        shell: true,
        cwd: appDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          MODERNJS_DEPLOY: 'edgeone',
          MODERN_DIST_ROOT: 'dist-eo',
        },
      });

      const outputDirectory = path.join(appDir, '.eo-output');
      const staticDirectory = path.join(outputDirectory, 'static');
      const funcsDirectory = path.join(outputDirectory, 'node-functions');
      const handlerFile = path.join(funcsDirectory, 'handler.js');
      const bootstrapFile1 = path.join(funcsDirectory, 'index.js');
      const bootstrapFile2 = path.join(funcsDirectory, '[[default]].js');

      expect(await fse.pathExists(staticDirectory)).toBe(true);
      expect(await fse.pathExists(handlerFile)).toBe(true);
      expect(await fse.pathExists(bootstrapFile1)).toBe(true);
      expect(await fse.pathExists(bootstrapFile2)).toBe(true);
    });
  });
} else {
  test('should skip the test cases', () => {
    expect(true).toBe(true);
  });
}
