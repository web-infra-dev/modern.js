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

const configDir = path.join(__dirname, './fixtures/svgr');

describe('svgr usage', () => {
  const fixtureDir = configDir;
  it('default', async () => {
    const configFile = path.join(configDir, './default.config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/default/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`jsx("svg"`)).toBeTruthy();
  });
  it('options with exclude', async () => {
    const configFile = path.join(configDir, './exclude.config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/exclude/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`data:image`)).toBeTruthy();
  });
});
