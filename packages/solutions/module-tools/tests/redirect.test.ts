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

describe('redirect', () => {
  const fixtureDir = path.join(__dirname, './fixtures/redirect');
  it('no-redirect', async () => {
    const configFile = path.join(fixtureDir, './no-redirect.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, './dist/no-redirect/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`import a from "./style.less"`)).toBeTruthy();
  });
  it('default', async () => {
    const configFile = path.join(fixtureDir, './redirect.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();

    const distFilePath = path.join(fixtureDir, './dist/redirect/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content.includes(`import a from "./style.css"`)).toBeTruthy();
  });
});
