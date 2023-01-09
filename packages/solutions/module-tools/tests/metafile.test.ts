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

describe('metafile', () => {
  const fixtureDir = path.join(__dirname, './fixtures/metafile');
  it('metafile is true', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distPath = path.join(fixtureDir, './dist');
    expect(fs.readdirSync(distPath).length === 2).toBeTruthy();
  });
});
