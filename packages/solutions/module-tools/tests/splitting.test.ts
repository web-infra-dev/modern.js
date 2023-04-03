import path from 'path';
import { fastGlob } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

beforeAll(() => {
  jest.mock('../src/utils/onExit.ts', () => {
    return {
      __esModule: true,
      addExitListener: jest.fn(() => 'mocked'),
    };
  });
  jest.setTimeout(30000);
});

describe('splitting usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/splitting');
  // https://esbuild.github.io/api/#splitting
  it('splitting is true', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const files = await fastGlob('dist/*', {
      cwd: fixtureDir,
    });
    expect(files.length === 3).toBeTruthy();
  });
});
