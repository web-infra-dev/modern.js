import path from 'path';
import { execa, fs as fse } from '@modern-js/utils';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('deploy', () => {
  beforeAll(async () => {
    await modernBuild(appDir, [], {});
  });

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
  });

  test('support csr when deploy target is node', async () => {
    await execa('npx modern deploy -s', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        MODERNJS_DEPLOY: 'node',
      },
    });
    const outputDirectory = path.join(appDir, '.output');
    const bootstrapJs = path.join(outputDirectory, 'index.js');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(outputDirectory, 'html');

    expect(await fse.pathExists(bootstrapJs)).toBe(true);
    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
  });

  test('support csr when deploy target is vercel', async () => {
    await execa('npx modern deploy -s', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        MODERNJS_DEPLOY: 'vercel',
      },
    });

    const outputDirectory = path.join(appDir, '.vercel/output');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(staticDirectory, 'html');
    const publicDirectory = path.join(staticDirectory, 'static');
    const configPath = path.join(outputDirectory, 'config.json');
    const config = await import(configPath);

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(await fse.pathExists(publicDirectory)).toBe(true);
    expect(config.version).toBe(3);
    expect(config).toMatchSnapshot();
  });

  test('support server when deploy target is cfWorkers', async () => {
    await execa('npx modern deploy -s', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        MODERNJS_DEPLOY: 'cfWorkers',
      },
    });

    const outputDirectory = path.join(appDir, '.cf-workers');
    const assetsDirectory = path.join(outputDirectory, 'assets');
    const staticDirectory = path.join(assetsDirectory, 'static');
    const htmlFile = path.join(assetsDirectory, 'one.html');

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlFile)).toBe(true);
  });

  test('support server when deploy target is edgeone', async () => {
    await execa('npx modern deploy -s', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        MODERNJS_DEPLOY: 'edgeone',
      },
    });

    const outputDirectory = path.join(appDir, '.eo-output');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlFile = path.join(outputDirectory, 'one.html');

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlFile)).toBe(true);
  });

  test('support server when deploy target is aliEsa', async () => {
    await execa('npx modern deploy -s', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        MODERNJS_DEPLOY: 'aliEsa',
      },
    });

    const outputDirectory = path.join(appDir, '.ali-esa');
    const distDirectory = path.join(outputDirectory, 'dist');
    const staticDirectory = path.join(distDirectory, 'static');
    const htmlFile = path.join(distDirectory, 'one.html');

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlFile)).toBe(true);
  });

  // netlify will clean dist directory, it will cause other tests failed, keep it at the last one
  test('support csr when deploy target is netlify', async () => {
    await execa('npx modern deploy -s', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        MODERNJS_DEPLOY: 'netlify',
      },
    });

    const outputDirectory = path.join(appDir, 'dist');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(outputDirectory, 'html');
    const redirectPath = path.join(outputDirectory, '_redirects');
    const redirects = (await fse.readFile(redirectPath)).toString();

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(redirects).toMatchSnapshot();
  });
});
