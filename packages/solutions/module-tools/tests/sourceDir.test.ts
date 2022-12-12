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

describe('sourceDir', () => {
  const fixtureDir = path.join(__dirname, './fixtures/sourceDir');
  it('base usage', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distIndexPath = path.join(fixtureDir, './dist/index.js');
    const distBrowserPath = path.join(fixtureDir, './dist/browser.js');
    const distCommonPath = path.join(fixtureDir, './dist/common.js');
    expect(await fs.pathExists(distIndexPath)).toBeTruthy();
    expect(await fs.pathExists(distBrowserPath)).toBeTruthy();
    expect(await fs.pathExists(distCommonPath)).toBeTruthy();
  });
});
