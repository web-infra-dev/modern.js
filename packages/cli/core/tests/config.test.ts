import path from 'path';
// import os from 'os';
import { isDev, getPort } from '@modern-js/utils';
import { resolveConfig } from '../src/config';
import {
  cli,
  loadUserConfig,
  initAppContext,
  initAppDir,
  manager,
  createPlugin,
  registerHook,
  useRunner,
} from '../src';
import { defaults } from '../src/config/defaults';

jest.mock('@modern-js/utils', () => ({
  __esModule: true,
  ...jest.requireActual('@modern-js/utils'),
  isDev: jest.fn(),
  getPort: jest.fn(),
}));

// const kOSRootDir =
//   os.platform() === 'win32' ? process.cwd().split(path.sep)[0] : '/';

describe('config', () => {
  /**
   * Typescript Type annotations cannot be used for esbuild-jest
   * test files that use jest.mock('@some/module')
   * refer to this esbuild-jest issue:
   * https://github.com/aelbore/esbuild-jest/issues/57
   * TODO: find a better solution to solve this problem while allowing us
   * to use esbuild, and have good TypeScript support
   */
  let loaded = {
    config: {},
    filePath: '',
    dependencies: [],
    pkgConfig: {},
    jsConfig: {},
  };
  let schemas: any[] = [];
  let restartWithExistingPort = 0;
  let argv: string[] = ['dev'];
  let configs: any[] = [];

  const getResolvedConfig = async () =>
    resolveConfig(loaded, configs, schemas, restartWithExistingPort, argv);

  const resetParams = () => {
    loaded = {
      config: {},
      filePath: '',
      dependencies: [],
      pkgConfig: {},
      jsConfig: {},
    };
    schemas = [];
    restartWithExistingPort = 0;
    argv = ['dev'];
    configs = [];
  };
  const resetMock = () => {
    jest.resetAllMocks();
    (isDev as jest.Mock).mockReturnValue(true);
    (getPort as jest.Mock).mockReturnValue(
      Promise.resolve(defaults.server.port),
    );
  };
  beforeEach(() => {
    resetParams();
    resetMock();
  });

  it('default', () => {
    expect(resolveConfig).toBeDefined();
    expect(cli).toBeDefined();
    expect(loadUserConfig).toBeDefined();
    expect(initAppContext).toBeDefined();
    expect(initAppDir).toBeDefined();
    expect(manager).toBeDefined();
    expect(createPlugin).toBeDefined();
    expect(registerHook).toBeDefined();
    expect(useRunner).toBeDefined();
  });

  it('initAppDir', async () => {
    expect(await initAppDir(__dirname)).toBe(path.resolve(__dirname, '..'));
    // expect(await initAppDir()).toBe(path.resolve(__dirname, '..'));

    // FIXME: windows 下面会失败，先忽略这个测试
    // try {
    //   await initAppDir(kOSRootDir);
    //   expect(true).toBe(false); // SHOULD NOT BE HERE
    // } catch (err: any) {
    //   expect(err.message).toMatch(/no package.json found in current work dir/);
    // }
  });

  test('should use default port if not restarting in dev mode', async () => {
    let resolved = await getResolvedConfig();
    expect(resolved.server.port).toEqual(defaults.server.port);
    expect(getPort).toHaveBeenCalledWith(defaults.server.port);

    // getResolvedConfig should use the value givin by getPort
    restartWithExistingPort = -1;
    (getPort as jest.Mock).mockClear();
    (getPort as jest.Mock).mockReturnValue(1111);
    resolved = await getResolvedConfig();
    expect(resolved.server.port).toEqual(1111);
    expect(getPort).toHaveBeenCalledWith(defaults.server.port);

    argv = ['start'];
    (isDev as jest.Mock).mockReturnValue(false);
    restartWithExistingPort = 0;
    resolved = await getResolvedConfig();
    expect(resolved.server.port).toEqual(defaults.server.port);

    restartWithExistingPort = 1234;
    resolved = await getResolvedConfig();
    expect(resolved.server.port).toEqual(defaults.server.port);

    restartWithExistingPort = -1;
    resolved = await getResolvedConfig();
    expect(resolved.server.port).toEqual(defaults.server.port);
  });

  test('should reuse existing port if restarting in dev mode', async () => {
    restartWithExistingPort = 1234;
    const resolved = await getResolvedConfig();
    expect(resolved.server.port).toEqual(1234);
  });
});

// type TEST = Parameters<typeof resolveConfig>;
// type TypeC = TEST[1];
