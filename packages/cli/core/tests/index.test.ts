import path from 'path';
import { cli } from '../src';
import { resolveConfig, loadUserConfig } from '../src/config';
import { loadEnv } from '../src/loadEnv';

jest.mock('../src/config', () => ({
  __esModule: true,
  ...jest.requireActual('../src/config'),
  loadUserConfig: jest.fn(),
  resolveConfig: jest.fn(),
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
    (resolveConfig as jest.Mock).mockReturnValue(
      Promise.resolve(mockResolveConfig),
    );
    (loadUserConfig as jest.Mock).mockImplementation(() =>
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
    await cli.init(['dev']);
    expect(loadEnv).toHaveBeenCalledWith(cwd, undefined);
    // TODO: add more test cases
  });
});
