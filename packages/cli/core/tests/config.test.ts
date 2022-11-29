import path from 'path';
import { isDev } from '@modern-js/utils';
import {
  // resolveConfig,
  // addServerConfigToDeps,
  createResolveConfig,
  createLoadedConfig,
} from '../src/config';
import {
  cli,
  initAppContext,
  initAppDir,
  manager,
  createPlugin,
  registerHook,
} from '../src';
// import  from '../src/config';

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
   * TypeScript Type annotations cannot be used for esbuild-jest
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
  let configs: any[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getResolvedConfig = async () =>
    createResolveConfig(loaded, configs, schemas);

  const resetParams = () => {
    loaded = {
      config: {},
      filePath: '',
      dependencies: [],
      pkgConfig: {},
      jsConfig: {},
    };
    schemas = [];
    configs = [];
  };
  const resetMock = () => {
    jest.resetAllMocks();
    (isDev as jest.Mock).mockReturnValue(true);
  };
  beforeEach(() => {
    resetParams();
    resetMock();
  });

  it('default', () => {
    expect(createResolveConfig).toBeDefined();
    expect(cli).toBeDefined();
    expect(createLoadedConfig).toBeDefined();
    expect(initAppContext).toBeDefined();
    expect(initAppDir).toBeDefined();
    expect(manager).toBeDefined();
    expect(createPlugin).toBeDefined();
    expect(registerHook).toBeDefined();
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

  // test('should use default port if not restarting in dev mode', async () => {
  //   let resolved = await getResolvedConfig();
  //   expect(resolved.server.port).toEqual(defaultConfig.server.port);
  //   expect(getPort).toHaveBeenCalledWith(defaultConfig.server.port);

  //   // getResolvedConfig should use the value given by getPort
  //   restartWithExistingPort = -1;
  //   (getPort as jest.Mock).mockClear();
  //   (getPort as jest.Mock).mockReturnValue(1111);
  //   resolved = await getResolvedConfig();
  //   expect(resolved.server.port).toEqual(1111);
  //   expect(getPort).toHaveBeenCalledWith(defaultConfig.server.port);

  //   argv = ['start'];
  //   (isDev as jest.Mock).mockReturnValue(false);
  //   restartWithExistingPort = 0;
  //   resolved = await getResolvedConfig();
  //   expect(resolved.server.port).toEqual(defaultConfig.server.port);

  //   restartWithExistingPort = 1234;
  //   resolved = await getResolvedConfig();
  //   expect(resolved.server.port).toEqual(defaultConfig.server.port);

  //   restartWithExistingPort = -1;
  //   resolved = await getResolvedConfig();
  //   expect(resolved.server.port).toEqual(defaultConfig.server.port);
  // });

  // test('should reuse existing port if restarting in dev mode', async () => {
  //   restartWithExistingPort = 1234;
  //   const resolved = await getResolvedConfig();
  //   expect(resolved.server.port).toEqual(1234);
  // });
});

// describe('addServerConfigToDeps', () => {
//   it('should add server config to deps', async () => {
//     const appDirectory = path.join(__dirname, './fixtures/index-test');
//     const deps: string[] = [];
//     await addServerConfigToDeps(deps, appDirectory, DEFAULT_SERVER_CONFIG);
//     expect(deps.length).toBe(1);
//     expect(deps[0]).toBe(
//       path.join(appDirectory, `${DEFAULT_SERVER_CONFIG}.js`),
//     );
//   });
// });
