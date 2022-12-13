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

describe('`tools` case', () => {
  const fixtureDir = path.join(__dirname, './fixtures/tools');
  it('tools.postcss', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret).toBeTruthy();

    const styleContent = await fs.readFile(
      path.join(fixtureDir, './dist/style.css'),
      'utf8',
    );
    expect(styleContent.includes('font-size: 16px;'));
    expect(styleContent.includes('background: white;'));
  });
});
