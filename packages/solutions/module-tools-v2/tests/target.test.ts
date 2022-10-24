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

const configDir = path.join(__dirname, './fixtures/target');

describe('target usage', () => {
  const fixtureDir = configDir;
  it('target is es2021', async () => {
    const configFile = path.join(configDir, './config.ts');
    let happenError = false;
    try {
      await runCli({
        argv: ['build'],
        configFile,
        appDirectory: fixtureDir,
      });
    } catch (e) {
      happenError = true;
    }

    expect(happenError).toBeTruthy();
  });
});
