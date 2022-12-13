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

describe('decorator', () => {
  const fixtureDir = path.join(__dirname, './fixtures/decorator');
  it('emitDecoratorMetadata', async () => {
    const configFile = path.join(fixtureDir, './modern.config.ts');
    const { success } = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, 'dist/main.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    expect(content).toMatchSnapshot();
  });
});
