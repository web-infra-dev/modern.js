import path from 'node:path';
import * as utils from '@modern-js/utils' with { rstest: 'importActual' };

const mockPathExists = rstest.fn();
const mockGetAliasConfig = rstest.fn();
const mockReadTsConfigByFile = rstest.fn();
const mockLoadFromProject = rstest.fn();
const mockIsDepExists = rstest.fn();
const mockEsbuildRegister = rstest.fn();
const mockTsconfigPathsRegister = rstest.fn();
const mockRegisterPathsLoader = rstest.fn();

rstest.mock('esbuild-register/dist/node', () => ({
  __esModule: true,
  register: (...args: unknown[]) => mockEsbuildRegister(...args),
}));

rstest.mock('@modern-js/utils/tsconfig-paths', () => ({
  __esModule: true,
  register: (...args: unknown[]) => mockTsconfigPathsRegister(...args),
}));

rstest.mock('../../src/esm/register-esm.mjs', () => ({
  __esModule: true,
  registerPathsLoader: (...args: unknown[]) => mockRegisterPathsLoader(...args),
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
    expect(resolveTsRuntimeRegisterMode(false, 22)).toBe('node-loader');
  });

  it('should choose esbuild fallback on Node < 22 without ts-node', async () => {
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(false, 20)).toBe('esbuild-register');
  });

  it('should choose ts-node when ts-node exists', async () => {
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(true, 22)).toBe('ts-node');
    expect(resolveTsRuntimeRegisterMode(true, 20)).toBe('ts-node');
  });

  beforeEach(() => {
    rstest.clearAllMocks();
    mockPathExists.mockResolvedValue(true);
    mockGetAliasConfig.mockReturnValue({
      absoluteBaseUrl: '/project',
      paths: {
        '@/*': ['src/*'],
      },
    });
  });

  it('should register tsconfig-paths when ts-node is missing', async () => {
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
    expect(mockEsbuildRegister).not.toBeCalled();
    expect(mockLoadFromProject).not.toBeCalled();
    expect(mockReadTsConfigByFile).not.toBeCalled();
  });

  it('should register ts-node when ts-node exists', async () => {
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
  });

  it('should do nothing when tsconfig does not exist', async () => {
    mockPathExists.mockResolvedValue(false);
    const { setupTsRuntime } = await import('../../src/utils/register');

    await setupTsRuntime('/project', '/project/dist', []);

    expect(mockReadTsConfigByFile).not.toBeCalled();
    expect(mockLoadFromProject).not.toBeCalled();
    expect(mockEsbuildRegister).not.toBeCalled();
    expect(mockTsconfigPathsRegister).not.toBeCalled();
  });
});
