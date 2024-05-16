import path from 'path';
import { execa, fs as fse } from '@modern-js/utils';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

describe('deploy', () => {
  beforeAll(async () => {
    await modernBuild(appDir, [], {});
  });

  test('support csr when deploy target is node', async () => {
    await execa('npx', ['modern', 'deploy', '-s'], {
      cwd: appDir,
      stdio: 'inherit',
    });
    const outputDirectory = path.join(appDir, '.output');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(outputDirectory, 'html');

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
  });

  test('support csr when deploy target is vercel', async () => {
    await execa('MODERNJS_DEPLOY=vercel npx modern deploy -s', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
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

  test('support csr when deploy target is netlify', async () => {
    await execa('MODERNJS_DEPLOY=netlify npx modern deploy -s', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
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
