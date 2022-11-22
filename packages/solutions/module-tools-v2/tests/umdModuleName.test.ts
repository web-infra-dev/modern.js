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

describe('umdModuleName usage', () => {
  const fixtureDir = path.join(__dirname, './fixtures/umdModuleName');
  it(`build success`, async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const ret = await runCli({
      argv: ['build'],
      configFile,
      appDirectory: fixtureDir,
    });

    expect(ret.success).toBeTruthy();
    const distFilePath = path.join(fixtureDir, './dist/index.js');
    const content = await fs.readFile(distFilePath, 'utf-8');
    // refre: https://github.com/babel/babel/blob/main/packages/babel-types/src/converters/toIdentifier.ts
    expect(content.includes('global.demo')).toBeTruthy();
  });
});
