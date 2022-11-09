import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

beforeAll(() => {
  jest.mock('../src/utils/onExit.ts', () => {
    return {
      __esModule: true,
      addExitListener: jest.fn(() => 'mocked'),
    };
  });
});

describe('build platform case', () => {
  const fixtureDir = path.join(__dirname, './fixtures/build-platform');
  it('no platform plugin', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const ret = await runCli({
      argv: ['build', '--platform'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });

  it('no platform plugin with platform params', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const ret = await runCli({
      argv: ['build', '--platform', 'plugin-1', 'plugin-2'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });

  it('with plugin, and build --platform', async () => {
    const configFile = path.join(fixtureDir, './config-with-plugin.ts');
    const ret = await runCli({
      argv: ['build', '--platform'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
    const distPath = path.join(fixtureDir, './dist/plugin-1.json');
    expect(await fs.pathExists(distPath));
  });

  it('with plugin, and build --platform plugin-2', async () => {
    const configFile = path.join(fixtureDir, './config-with-plugin2.ts');
    const ret = await runCli({
      argv: ['build', '--platform', 'plugin-2'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
    const distPath = path.join(fixtureDir, './dist/plugin-2.json');
    expect(await fs.pathExists(distPath));
  });

  it('with plugin, and build --platform plugin-3 plugin-4', async () => {
    const configFile = path.join(fixtureDir, './config-with-plugins.ts');
    const ret = await runCli({
      argv: ['build', '--platform', 'plugin-3', 'plugin-4'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
    const plugin3DistPath = path.join(fixtureDir, './dist/plugin-3.json');
    expect(await fs.pathExists(plugin3DistPath)).toBeTruthy();
    const plugin4DistPath = path.join(fixtureDir, './dist/plugin-4.json');
    expect(await fs.pathExists(plugin4DistPath)).toBeTruthy();
  });

  it('nothing platform params', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const ret = await runCli({
      argv: ['build', '--platform', 'plugin-5'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });

  it('nothing platform params', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const ret = await runCli({
      argv: ['build', '--platform', 'plugin-5'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });

  it('have non-existent platform options', async () => {
    const configFile = path.join(fixtureDir, './config-with-plugins-1.ts');
    const ret = await runCli({
      argv: ['build', '--platform', 'plugin-5', 'plugin-7'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();

    const distPath = path.join(fixtureDir, './dist/plugin-5.json');
    expect(await fs.pathExists(distPath)).toBeTruthy();
  });

  it('have non-existent platform options', async () => {
    const configFile = path.join(fixtureDir, './config-with-plugins-1.ts');
    const ret = await runCli({
      argv: ['build', '--platform', 'plugin-7'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });
});
