import path from 'path';
import { fs } from '@modern-js/utils';
// import { fs, globby } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';
// import { bundleDistPath } from './constants';

initBeforeTest();

beforeAll(() => {
  jest.mock('../src/utils/onExit.ts', () => {
    return {
      __esModule: true,
      addExitListener: jest.fn(() => 'mocked'),
    };
  });
});

describe('copy usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/copy');
  const configFile = path.join(fixtureDir, './config-1.ts');

  it('build success', async () => {
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
  });

  it('copy file to file', async () => {
    const distFilePath = path.join(fixtureDir, './dist/temp-1/b.png');
    const copyFileExist = await fs.pathExists(distFilePath);
    expect(copyFileExist).toBeTruthy();
  });

  it('copy file to dir', async () => {
    const distFilePath = path.join(fixtureDir, './dist/temp-2/a.png');
    const copyFileExist = await fs.pathExists(distFilePath);
    expect(copyFileExist).toBeTruthy();
  });

  it('copy dir to dir', async () => {
    let distFilePath = path.join(fixtureDir, './dist/temp-3/a.png');
    let copyFileExist = await fs.pathExists(distFilePath);
    expect(copyFileExist).toBeTruthy();
    distFilePath = path.join(fixtureDir, './dist/temp-3/b.txt');
    copyFileExist = await fs.pathExists(distFilePath);
    expect(copyFileExist).toBeTruthy();
  });

  it('copy dir to file', async () => {
    const distFilePath = path.join(fixtureDir, './dist/temp-4/_index.html');
    const copyFileExist = await fs.pathExists(distFilePath);
    expect(copyFileExist).toBeTruthy();
  });

  it('copy glob to dir', async () => {
    const distFilePath = path.join(fixtureDir, './dist/temp-5/index.html');
    const copyFileExist = await fs.pathExists(distFilePath);
    expect(copyFileExist).toBeTruthy();
  });

  it('copy glob to file', async () => {
    const distFilePath = path.join(fixtureDir, './dist/temp-6/index.html');
    const copyFileExist = await fs.pathExists(distFilePath);
    expect(copyFileExist).toBeTruthy();
  });
});
