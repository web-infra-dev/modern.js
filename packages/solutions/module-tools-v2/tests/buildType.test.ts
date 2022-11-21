import path from 'path';
import { globby, slash } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';
import { bundleDistPath, bundlelessDistPath } from './constants';

initBeforeTest();

beforeAll(() => {
  jest.mock('../src/utils/onExit.ts', () => {
    return {
      __esModule: true,
      addExitListener: jest.fn(() => 'mocked'),
    };
  });
});

describe('`buildType` case', () => {
  const fixtureDir = path.join(__dirname, './fixtures/buildType');
  it('buildType is bundle', async () => {
    const configFile = path.join(fixtureDir, './bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFiles = await globby(
      slash(path.join(fixtureDir, bundleDistPath)),
    );
    expect(distFiles.length).toBe(1);
  });

  it('buildType is bundleless', async () => {
    const configFile = path.join(fixtureDir, './bundleless.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distFiles = await globby(
      slash(path.join(fixtureDir, bundlelessDistPath)),
    );
    expect(distFiles.length).toBe(2);
  });
});
