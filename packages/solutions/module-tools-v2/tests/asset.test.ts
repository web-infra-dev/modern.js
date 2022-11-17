import path from 'path';
import { fs, globby } from '@modern-js/utils';
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

const configDir = path.join(__dirname, './fixtures/asset');

describe('asset.path', () => {
  const fixtureDir = path.join(__dirname, './fixtures/asset/path');
  it('buildType is bundleless', async () => {
    const configFile = path.join(configDir, './path.bundleless.config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    console.info(ret);
    expect(ret.success).toBeTruthy();

    const distDir = path.join(fixtureDir, bundlelessDistPath);
    const distFilePath = path.join(distDir, './index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes('./asset/')).toBeTruthy();
  });

  it('buildType is bundle', async () => {
    const configFile = path.join(configDir, './path.bundle.config.ts');
    await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    const distDir = path.join(fixtureDir, bundleDistPath);
    const distFilePath = path.join(distDir, './index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes('./asset/')).toBeTruthy();

    const pngFileDirName = path.join(distDir, './asset');
    const files = await globby(`${pngFileDirName}/*.png`);
    expect(files.length).toBe(1);
  });
});
