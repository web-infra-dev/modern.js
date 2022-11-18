import path from 'path';
import { globby } from '@modern-js/utils';
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

describe('globals usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/metafile');
  it(`build success`, async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const globPattern = path.join(fixtureDir, './dist/metafile-*.json');
    const files = await globby(globPattern);
    expect(files.length).toBe(1);
  });
});
