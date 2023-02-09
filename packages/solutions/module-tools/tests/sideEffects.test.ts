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

describe('sideEffects', () => {
  const fixtureDir = path.join(__dirname, './fixtures/sideEffects');
  it('base usage', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distIndexPath = path.join(fixtureDir, './dist/index.js');
    expect(await fs.pathExists(distIndexPath)).toBeTruthy();
    expect(
      (await fs.readFile(distIndexPath, 'utf-8')).length === 0,
    ).toBeTruthy();
  });
});
