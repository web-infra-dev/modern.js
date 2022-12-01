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

describe('entry usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/entry');
  it('entry is object', async () => {
    const configFile = path.join(fixtureDir, './object.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, './dist/object/main.js');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();
  });

  it('entry is array', async () => {
    const configFile = path.join(fixtureDir, './array.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, './dist/array/index.js');
    expect(await fs.pathExists(distFilePath)).toBeTruthy();

    const distBrowserFilePath = path.join(
      fixtureDir,
      './dist/array/browser.js',
    );
    expect(await fs.pathExists(distBrowserFilePath)).toBeTruthy();
  });
});
