import path from 'node:path';
import * as utils from '@modern-js/utils' with { rstest: 'importActual' };

const mockPathExists = rstest.fn();
const mockGetAliasConfig = rstest.fn();
const mockReadTsConfigByFile = rstest.fn();
const mockLoadFromProject = rstest.fn();
const mockIsDepExists = rstest.fn();
const mockTsconfigPathsRegister = rstest.fn();
const mockRegisterPathsLoader = rstest.fn();
const mockRegisterModuleHooks = rstest.fn();

const originalTypeScriptFeature = (process.features as any).typescript;

const setNativeTypeScriptSupport = (value: boolean | string | undefined) => {
  Object.defineProperty(process.features, 'typescript', {
    value,
    configurable: true,
    writable: true,
  });
};

rstest.mock('@modern-js/utils/tsconfig-paths', () => ({
  __esModule: true,
  register: (...args: unknown[]) => mockTsconfigPathsRegister(...args),
}));

rstest.mock('../../src/esm/register-esm.mjs', () => ({
  __esModule: true,
  registerPathsLoader: (...args: unknown[]) => mockRegisterPathsLoader(...args),
  registerModuleHooks: (...args: unknown[]) => mockRegisterModuleHooks(...args),
}));

rstest.mock('@modern-js/utils', () => ({
  __esModule: true,
  ...utils,
  fs: {
    ...utils.fs,
    pathExists: (...args: unknown[]) => mockPathExists(...args),
  },
  getAliasConfig: (...args: unknown[]) => mockGetAliasConfig(...args),
  readTsConfigByFile: (...args: unknown[]) => mockReadTsConfigByFile(...args),
  loadFromProject: (...args: unknown[]) => mockLoadFromProject(...args),
  isDepExists: (...args: unknown[]) => mockIsDepExists(...args),
}));

describe('setupTsRuntime', () => {
  it('should choose native loader on Node 22+ without ts-node', async () => {
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(false, undefined, 22)).toBe(
      'node-loader',
    );
  });

  it('should prefer native capability over node version', async () => {
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(false, true, 20)).toBe('node-loader');
  });

  it('should treat string native capability as supported', async () => {
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(false, 'strip', 20)).toBe(
      'node-loader',
    );
  });

  it('should not fallback to node version when native capability is false', async () => {
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(false, false, 22)).toBe('unsupported');
  });

  it('should choose unsupported on Node < 22 without ts-node', async () => {
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(false, false, 20)).toBe('unsupported');
  });

  it('should choose ts-node when ts-node exists', async () => {
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(true, undefined, 22)).toBe(
      'node-loader',
    );
    expect(resolveTsRuntimeRegisterMode(true, false, 20)).toBe('ts-node');
  });

  beforeEach(() => {
    rstest.clearAllMocks();
    setNativeTypeScriptSupport(originalTypeScriptFeature);
    mockPathExists.mockResolvedValue(true);
    mockGetAliasConfig.mockReturnValue({
      absoluteBaseUrl: '/project',
      paths: {
        '@/*': ['src/*'],
      },
    });
  });

  afterAll(() => {
    setNativeTypeScriptSupport(originalTypeScriptFeature);
  });

  it('should register tsconfig-paths when native support is available', async () => {
    mockIsDepExists.mockReturnValue(false);
    const { setupTsRuntime } = await import('../../src/utils/register');

    await setupTsRuntime('/project', '/project/dist', []);

    expect(mockRegisterPathsLoader).toBeCalledTimes(1);
    expect(mockTsconfigPathsRegister).toBeCalledWith({
      baseUrl: '/project',
      paths: {
        '@/*': ['src/*'],
      },
    });
    expect(mockLoadFromProject).not.toBeCalled();
    expect(mockReadTsConfigByFile).not.toBeCalled();
  });

  it('should throw when no TypeScript runtime support is available', async () => {
    setNativeTypeScriptSupport(false);
    mockIsDepExists.mockReturnValue(false);
    const { setupTsRuntime } = await import('../../src/utils/register');

    await expect(
      setupTsRuntime('/project', '/project/dist', []),
    ).rejects.toThrow('requires Node.js native TypeScript support');

    expect(mockRegisterPathsLoader).not.toBeCalled();
    expect(mockTsconfigPathsRegister).not.toBeCalled();
    expect(mockLoadFromProject).not.toBeCalled();
  });

  it('should use node loader when native capability is strip mode', async () => {
    setNativeTypeScriptSupport('strip');
    mockIsDepExists.mockReturnValue(false);
    const { setupTsRuntime } = await import('../../src/utils/register');

    await setupTsRuntime('/project', '/project/dist', []);

    expect(mockRegisterPathsLoader).toBeCalledTimes(1);
  });

  it('should register ts-node when ts-node exists', async () => {
    setNativeTypeScriptSupport(false);
    mockIsDepExists.mockReturnValue(true);
    const { setupTsRuntime } = await import('../../src/utils/register');
    mockReadTsConfigByFile.mockReturnValue({
      'ts-node': {
        compilerOptions: {
          module: 'commonjs',
        },
      },
    });
    const tsNodeRegister = rstest.fn();
    mockLoadFromProject.mockResolvedValue({
      register: tsNodeRegister,
    });

    await setupTsRuntime('/project', '/project/dist', []);

    expect(mockReadTsConfigByFile).toBeCalledWith(
      path.resolve('/project', 'tsconfig.json'),
    );
    expect(tsNodeRegister).toBeCalledTimes(1);
    expect(mockTsconfigPathsRegister).toBeCalledTimes(1);
    expect(mockRegisterModuleHooks).not.toBeCalled();
  });

  it('should register module hooks for module projects when ts-node exists', async () => {
    setNativeTypeScriptSupport(false);
    mockIsDepExists.mockReturnValue(true);
    const { setupTsRuntime } = await import('../../src/utils/register');
    mockReadTsConfigByFile.mockReturnValue({
      'ts-node': {},
    });
    mockLoadFromProject.mockResolvedValue({
      register: rstest.fn(),
    });

    await setupTsRuntime('/project', '/project/dist', [], {
      moduleType: 'module',
    });

    expect(mockRegisterModuleHooks).toBeCalledWith({
      appDir: '/project',
      distDir: '/project/dist',
      alias: [],
    });
  });

  it('should do nothing when tsconfig does not exist', async () => {
    mockPathExists.mockResolvedValue(false);
    const { setupTsRuntime } = await import('../../src/utils/register');

    await setupTsRuntime('/project', '/project/dist', []);

    expect(mockReadTsConfigByFile).not.toBeCalled();
    expect(mockLoadFromProject).not.toBeCalled();
    expect(mockTsconfigPathsRegister).not.toBeCalled();
  });
});
