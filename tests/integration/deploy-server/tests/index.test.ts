import path from 'path';
import { execa, fs as fse } from '@modern-js/utils';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

// bff project's dependencies is more complex, so use bff project to test
describe('deploy', () => {
  beforeAll(async () => {
    await modernBuild(appDir, [], {});
  });

  test('support server when deploy target is node', async () => {
    await execa('npx modern deploy --skip-build', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        MODERNJS_DEPLOY: 'node',
      },
    });
    const outputDirectory = path.join(appDir, '.output');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(outputDirectory, 'html');
    const apiFile = path.join(outputDirectory, 'api/lambda/index.js');
    const bootstrapPath = path.join(outputDirectory, 'index.js');

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(await fse.pathExists(apiFile)).toBe(true);
    expect(await fse.pathExists(bootstrapPath)).toBe(true);
  });

  test('support server when deploy target is vercel', async () => {
    await execa('npx modern deploy --skip-build', {
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
    const funcsDirectory = path.join(
      outputDirectory,
      'functions',
      'index.func',
    );
    const funcsConfigPath = path.join(funcsDirectory, '.vc-config.json');
    const funcsConfig = await import(funcsConfigPath);
    const bootstrapFile = path.join(funcsDirectory, 'index.js');
    const htmlDirectory = path.join(funcsDirectory, 'html');
    const publicDirectory = path.join(staticDirectory, 'static');
    const configPath = path.join(outputDirectory, 'config.json');
    const config = await import(configPath);

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(await fse.pathExists(publicDirectory)).toBe(true);
    expect(await fse.pathExists(bootstrapFile)).toBe(true);
    expect(config).toMatchSnapshot();
    expect(funcsConfig).toMatchSnapshot();
  });

  test('support server when deploy target is netlify', async () => {
    await execa('npx modern deploy --skip-build', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        MODERNJS_DEPLOY: 'netlify',
      },
    });

    const publishDir = path.join(appDir, 'dist');
    const outputDirectory = path.join(appDir, '.netlify');
    const staticDirectory = path.join(publishDir, 'static');
    const funcsDirectory = path.join(outputDirectory, 'functions');
    const redirectFilePath = path.join(publishDir, '_redirects');
    const redirects = (await fse.readFile(redirectFilePath)).toString();

    const bootstrapFile = path.join(funcsDirectory, 'index.js');
    const htmlDirectory = path.join(funcsDirectory, 'html');

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(await fse.pathExists(bootstrapFile)).toBe(true);
    expect(redirects).toMatchSnapshot();
  });
});
