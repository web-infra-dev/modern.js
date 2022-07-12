import * as path from 'path';
import { manager } from '@modern-js/core';
import plugin from '../src';

import { hasTailwind } from '../src/plugins/css';
import { dev } from '../src/dev';

jest.mock('../src/dev');
jest.mock('@modern-js/core', () => ({
  __esModule: true,
  ...jest.requireActual('@modern-js/core'),
  registerHook: jest.fn(),
}));

describe('plugin-unbundle', () => {
  let originalArgv: string[];
  beforeAll(() => {
    originalArgv = process.argv;
    process.argv = ['xxx/xxx/xxx/node', 'xxx/xxx/modern', 'dev', '--unbundled'];
  });

  afterAll(() => {
    process.argv = originalArgv;
  });

  it('default', () => {
    expect(plugin).toBeDefined();
  });

  it('test tailwind plugin exists', () => {
    expect(
      hasTailwind(path.join(__dirname, './fixtures/tailwind-example')),
    ).toBe(true);
  });

  it('schema', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const result = await runner.validateSchema();
    expect(result).toMatchSnapshot();
  });

  it('commands', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const closeDevServerMock = jest.fn().mockReturnValue(Promise.resolve());
    jest.mocked(dev).mockResolvedValue(closeDevServerMock);
    const devCommand = {
      option: jest.fn(),
      action: jest.fn(),
    };
    const program = {
      commandsMap: {
        get: jest.fn().mockReturnValue(devCommand),
      },
    };
    await runner.commands({ program } as any);
    expect(program.commandsMap.get).toHaveBeenCalledWith('dev');
    expect(devCommand.option).toHaveBeenCalledWith(
      '--unbundled',
      expect.anything(),
    );
    expect(devCommand.action).toHaveBeenCalledTimes(1);
    const devCommandAction = devCommand.action.mock.calls[0][0];
    expect(devCommandAction).toBeTruthy();
    expect(typeof devCommandAction).toBe('function');
    await devCommandAction();
    expect(dev).toHaveBeenCalledTimes(1);
    expect(closeDevServerMock).not.toHaveBeenCalled();

    await runner.beforeRestart();
    await devCommandAction();
    expect(closeDevServerMock).toHaveBeenCalledTimes(1);

    closeDevServerMock.mockClear();
    await devCommandAction();
    expect(closeDevServerMock).toHaveBeenCalledTimes(1);
  });
});
