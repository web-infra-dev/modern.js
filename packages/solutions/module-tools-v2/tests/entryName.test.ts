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

describe('entryName usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/entryName');
  // https://esbuild.github.io/api/#entry-names
  it('entryName is [dir]/[name]-[hash]', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const files = await globby(`${fixtureDir}/**/*.js`);
    expect(files.length).toBe(1);
    expect(files[0]).not.toBe('index.js');
    expect(files[0]).toMatchSnapshot();
  });
});
