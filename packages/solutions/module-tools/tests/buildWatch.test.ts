import path from 'path';
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

describe('build watch', () => {
  const fixtureDir = path.join(__dirname, './fixtures/watch');
  it('normal', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const ret = await runCli({
      argv: ['build', '--watch'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });
});
