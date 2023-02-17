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

describe('`buildPreset` case', () => {
  const fixtureDir = path.join(__dirname, './fixtures/buildPreset');
  it('buildPreset is string', async () => {
    const appDirectory = path.join(fixtureDir, './string');
    const configFile = path.join(fixtureDir, './string.config.ts');

    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory,
    });
    expect(ret.success).toBeTruthy();

    const distPath = path.join(appDirectory, 'dist');
    expect(
      await fs.pathExists(path.join(distPath, './lib/index.js')),
    ).toBeTruthy();
    expect(
      await fs.pathExists(path.join(distPath, './es/index.js')),
    ).toBeTruthy();
    expect(
      await fs.pathExists(path.join(distPath, './types/index.d.ts')),
    ).toBeFalsy();
  });

  it('buildPreset is function', async () => {
    const appDirectory = path.join(fixtureDir, './function');
    const configFile = path.join(fixtureDir, './function.config.ts');

    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory,
    });
    expect(ret.success).toBeTruthy();

    const distPath = path.join(appDirectory, 'dist');
    expect(
      await fs.pathExists(path.join(distPath, './lib/index.js')),
    ).toBeTruthy();
    expect(
      await fs.pathExists(path.join(distPath, './es/index.js')),
    ).toBeTruthy();
    expect(
      await fs.pathExists(path.join(distPath, './umd/index.js')),
    ).toBeTruthy();
  });

  it('use extendPreset', async () => {
    const appDirectory = path.join(fixtureDir, './function');
    const configFile = path.join(fixtureDir, './extend-preset.config.ts');

    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory,
    });
    expect(ret.success).toBeTruthy();

    const distPath = path.join(appDirectory, 'dist');
    expect(
      await fs.pathExists(path.join(distPath, './esm/index.js')),
    ).toBeTruthy();
    expect(
      await fs.pathExists(path.join(distPath, './cjs/index.js')),
    ).toBeTruthy();

    expect(
      await fs.readFile(path.join(distPath, './esm/utils.js'), 'utf-8'),
    ).toContain('test');
    expect(
      await fs.readFile(path.join(distPath, './cjs/utils.js'), 'utf-8'),
    ).toContain('test');
  });

  it('error1', async () => {
    const appDirectory = path.join(fixtureDir, './error1');
    const configFile = path.join(fixtureDir, './error-1.config.ts');

    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory,
    });
    expect(ret.success).toBeFalsy();
    expect(
      ret.error?.message.includes(
        'The `buildPreset` function does not allow no return value',
      ),
    ).toBeTruthy();
  });

  it('error2', async () => {
    const appDirectory = path.join(fixtureDir, './error2');
    const configFile = path.join(fixtureDir, './error-2.config.ts');

    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory,
    });
    expect(ret.success).toBeFalsy();
    expect(
      ret.error?.message.includes(
        'when buildType is bundleless, the format must be equal to one of the allowed values: (cjs, esm)',
      ),
    ).toBeTruthy();
  });

  it('error3', async () => {
    const appDirectory = path.join(fixtureDir, './error3');
    const configFile = path.join(fixtureDir, './error-3.config.ts');

    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory,
    });
    expect(ret.success).toBeFalsy();
    expect(
      ret.error?.message.includes(
        'when buildType is bundleless, the format must be equal to one of the allowed values: (cjs, esm)',
      ),
    ).toBeTruthy();
  });
});
