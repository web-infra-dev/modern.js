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

const fixtureDir = path.join(__dirname, './fixtures/dev');
describe('`dev` case', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('normal usage', async () => {
    const configFile = path.join(fixtureDir, './config.ts');
    const _exit = process.exit;
    process.exit = jest.fn(() => 0) as any;
    const exit = jest.spyOn(process, 'exit');

    await runCli({
      argv: ['dev'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(exit).toBeCalled();
    process.exit = _exit;
  });

  it('one plugin', async () => {
    const configFile = path.join(fixtureDir, './config-with-plugin.ts');

    const ret = await runCli({
      argv: ['dev'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });

  it('more plugins', async () => {
    const configFile = path.join(fixtureDir, './config-with-plugins.ts');
    jest.mock('@modern-js/utils', () => {
      const originalModule = jest.requireActual('@modern-js/utils');

      return {
        __esModule: true,
        ...originalModule,
        inquirer: {
          prompt: () => {
            return { choiceDevTool: 'dev-1' };
          },
        },
      };
    });

    const ret = await runCli({
      argv: ['dev'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });

  it('beforeDevMenu', async () => {
    const configFile = path.join(fixtureDir, './before-dev-menu.ts');
    jest.mock('@modern-js/utils', () => {
      const originalModule = jest.requireActual('@modern-js/utils');

      return {
        __esModule: true,
        ...originalModule,
        inquirer: {
          prompt: () => {
            return { choiceDevTool: 'dev-1' };
          },
        },
      };
    });

    const ret = await runCli({
      argv: ['dev'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });

  it('dev with params', async () => {
    const configFile = path.join(fixtureDir, './config-with-plugin.ts');

    const ret = await runCli({
      argv: ['dev', 'plugin-1'],
      configFile,
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });
});
