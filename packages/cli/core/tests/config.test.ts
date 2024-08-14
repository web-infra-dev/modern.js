import path from 'path';
import { isDev } from '@modern-js/utils';
import { createResolveConfig, createLoadedConfig } from '../src/config';
import {
  cli,
  initAppContext,
  initAppDir,
  manager,
  createPlugin,
  registerHook,
} from '../src';

jest.mock('@modern-js/utils', () => ({
  __esModule: true,
  ...jest.requireActual('@modern-js/utils'),
  isDev: jest.fn(),
  getPort: jest.fn(),
}));

describe('config', () => {
  let loaded = {
    config: {},
    filePath: '',
    dependencies: [],
    pkgConfig: {},
    jsConfig: {},
  };
  let schemas: any[] = [];
  let configs: any[] = [];

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
});
