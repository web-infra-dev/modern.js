import path from 'path';
import { cli, mergeOptions } from '../src';
import { createResolveConfig, createLoadedConfig } from '../src/config';
import { loadEnv } from '../src/loadEnv';

jest.mock('../src/config', () => ({
  __esModule: true,
  ...jest.requireActual('../src/config'),
  createLoadedConfig: jest.fn(),
  createResolveConfig: jest.fn(),
}));

jest.mock('../src/loadEnv', () => ({
  __esModule: true,
  ...jest.requireActual('../src/loadEnv'),
  loadEnv: jest.fn(),
}));

describe('@modern-js/core test', () => {
  let mockResolveConfig: any = {};
  let mockLoadedConfig: any = {};
  const cwdSpy = jest.spyOn(process, 'cwd');
  const cwd = path.join(__dirname, './fixtures/index-test');

  const resetMock = () => {
    jest.resetAllMocks();
    cwdSpy.mockReturnValue(cwd);
    (createResolveConfig as jest.Mock).mockReturnValue(
      Promise.resolve(mockResolveConfig),
    );
    (createLoadedConfig as jest.Mock).mockImplementation(() =>
      Promise.resolve(mockLoadedConfig),
    );
  };

  const resetValues = () => {
    mockLoadedConfig = {
      config: {},
      filePath: false,
      dependencies: [],
      pkgConfig: {},
      jsConfig: {},
    };
    mockResolveConfig = {
      server: {
        port: 8080,
      },
      output: {
        path: './my/test/path',
      },
    };
  };

  beforeEach(() => {
    resetValues();
    resetMock();
  });

  it('test cli create', () => {
    expect(cli).toBeTruthy();
  });

  it('test cli init dev', async () => {
    cwdSpy.mockReturnValue(path.join(cwd, 'nested-folder'));
    await cli.init();
    expect(loadEnv).toHaveBeenCalledWith(cwd, undefined);
  });
});

describe('test mergeOptions', () => {
  it('serverConfigFile must exist', () => {
    const options = mergeOptions({});
    expect(options).toHaveProperty('serverConfigFile');
  });

  it('serverConfigFile can be overwritten', () => {
    const options = mergeOptions({
      serverConfigFile: 'test',
    });
    expect(options.serverConfigFile).toBe('test');
  });
});
