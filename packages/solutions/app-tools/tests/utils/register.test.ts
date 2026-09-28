import fs from 'node:fs';
import path from 'node:path';
import * as utils from '@modern-js/utils' with { rstest: 'importActual' };

const mockPathExists = rstest.fn();
const mockGetAliasConfig = rstest.fn();
const mockReadTsConfigByFile = rstest.fn();
const mockReadTsConfigWithExtends = rstest.fn();
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
  readTsConfigWithExtends: (...args: unknown[]) =>
    mockReadTsConfigWithExtends(...args),
  loadFromProject: (...args: unknown[]) => mockLoadFromProject(...args),
  isDepExists: (...args: unknown[]) => mockIsDepExists(...args),
}));

describe('setupTsRuntime', () => {
  it('should follow node major fallback when native capability is undefined', async () => {
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    setNativeTypeScriptSupport(undefined);
    const expected =
      Number(process.versions.node.split('.')[0]) >= 22
        ? 'node-loader'
        : 'unsupported';
    expect(resolveTsRuntimeRegisterMode(false)).toBe(expected);
  });

  it('should prefer native capability over node version', async () => {
    setNativeTypeScriptSupport(true);
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(false)).toBe('node-loader');
  });

  it('should treat string native capability as supported', async () => {
    setNativeTypeScriptSupport('strip');
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(false)).toBe('node-loader');
  });

  it('should not fallback to node version when native capability is false', async () => {
    setNativeTypeScriptSupport(false);
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(false)).toBe('unsupported');
  });

  it('should choose ts-node when ts-node exists and native support is enabled', async () => {
    setNativeTypeScriptSupport('strip');
    const { resolveTsRuntimeRegisterMode } = await import(
      '../../src/utils/register'
    );
    expect(resolveTsRuntimeRegisterMode(true)).toBe('ts-node');
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
    // Real fixtures go through the real reader; the virtual `/project` app
    // gets its `ts-node` field from `mockReadTsConfigByFile` like before.
    mockReadTsConfigWithExtends.mockImplementation((file: string) => {
      if (fs.existsSync(file)) {
        return utils.readTsConfigWithExtends(file);
      }
      const raw = mockReadTsConfigByFile(file) ?? {};
      return {
        path: file,
        files: [file],
        raw,
        compilerOptions: raw.compilerOptions ?? {},
      };
    });
  });

  afterAll(() => {
    setNativeTypeScriptSupport(originalTypeScriptFeature);
  });

  it('should use node loader when ts-node does not exist but native capability is available', async () => {
    // Establish this test's own precondition instead of relying on the ambient
    // `process.features.typescript`, which is `false` on a plain Node 22 run
    // (no --experimental-strip-types) and would otherwise resolve to 'unsupported'.
    setNativeTypeScriptSupport(true);
    mockIsDepExists.mockReturnValue(false);
    const { setupTsRuntime } = await import('../../src/utils/register');

    await setupTsRuntime('/project', '/project/dist', []);

    expect(mockRegisterPathsLoader).toBeCalledTimes(1);
    expect(mockRegisterModuleHooks).not.toBeCalled();
    expect(mockRegisterPathsLoader).toBeCalledWith({
      baseUrl: '/project',
      appDir: '/project',
      paths: {
        '@/*': ['src/*'],
      },
    });
    expect(mockLoadFromProject).not.toBeCalled();
    expect(mockReadTsConfigByFile).not.toBeCalled();
  });

  it('should skip runtime setup when native capability is disabled and ts-node does not exist', async () => {
    setNativeTypeScriptSupport(false);
    mockIsDepExists.mockReturnValue(false);
    const { setupTsRuntime } = await import('../../src/utils/register');

    await expect(setupTsRuntime('/project', '/project/dist', [])).resolves.toBe(
      undefined,
    );

    expect(mockRegisterPathsLoader).not.toBeCalled();
    expect(mockRegisterModuleHooks).not.toBeCalled();
    expect(mockTsconfigPathsRegister).not.toBeCalled();
    expect(mockLoadFromProject).not.toBeCalled();
  });

  it('should prefer ts-node when native capability exists and ts-node also exists', async () => {
    setNativeTypeScriptSupport('strip');
    mockIsDepExists.mockReturnValue(true);
    const { setupTsRuntime } = await import('../../src/utils/register');
    mockReadTsConfigByFile.mockReturnValue({
      'ts-node': {},
    });
    const tsNodeRegister = rstest.fn();
    mockLoadFromProject.mockResolvedValue({
      register: tsNodeRegister,
    });

    await setupTsRuntime('/project', '/project/dist', []);

    expect(mockRegisterPathsLoader).not.toBeCalled();
    expect(mockRegisterModuleHooks).not.toBeCalled();
    expect(mockTsconfigPathsRegister).toBeCalledTimes(1);
    expect(tsNodeRegister).toBeCalledTimes(1);
    expect(mockReadTsConfigByFile).toBeCalledWith(
      path.resolve('/project', 'tsconfig.json'),
    );
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
    const tsNodeRegister = rstest.fn();
    mockReadTsConfigByFile.mockReturnValue({
      'ts-node': {},
    });
    mockLoadFromProject.mockResolvedValue({
      register: tsNodeRegister,
    });

    await setupTsRuntime('/project', '/project/dist', [], {
      moduleType: 'module',
    });

    expect(mockRegisterModuleHooks).toBeCalledWith({
      appDir: '/project',
      distDir: '/project/dist',
      baseUrl: '/project',
      paths: {
        '@/*': ['src/*'],
      },
      tsconfigPath: path.resolve('/project', 'tsconfig.json'),
      compilerOptions: {},
    });
    expect(mockReadTsConfigByFile).toBeCalledWith(
      path.resolve('/project', 'tsconfig.json'),
    );
    expect(tsNodeRegister).toBeCalledTimes(1);
    expect(mockTsconfigPathsRegister).not.toBeCalled();
  });

  describe('server tsconfig resolution', () => {
    const fixtures = path.resolve(__dirname, '../fixtures/tsconfig');

    const registerWithTsNode = async (
      appDir: string,
      options: Record<string, unknown> = {},
      tsConfig?: Record<string, unknown>,
    ) => {
      setNativeTypeScriptSupport(false);
      mockIsDepExists.mockReturnValue(true);
      if (tsConfig) {
        // A virtual entry file (`ts-node` field and all) on top of the
        // fixture's real extends chain.
        mockReadTsConfigByFile.mockReturnValue(tsConfig);
        mockReadTsConfigWithExtends.mockImplementation((file: string) => ({
          ...(fs.existsSync(file)
            ? utils.readTsConfigWithExtends(file)
            : { path: file, files: [file], compilerOptions: {} }),
          raw: tsConfig,
        }));
      } else {
        // Fixtures are read from disk exactly like in production.
        mockReadTsConfigByFile.mockImplementation(utils.readTsConfigByFile);
      }
      const tsNodeRegister = rstest.fn();
      mockLoadFromProject.mockResolvedValue({ register: tsNodeRegister });
      const { setupTsRuntime } = await import('../../src/utils/register');

      await setupTsRuntime(appDir, path.join(appDir, 'dist'), [], options);

      expect(tsNodeRegister).toBeCalledTimes(1);
      return tsNodeRegister.mock.calls[0][0] as Record<string, unknown>;
    };

    it('should force NodeNext on ts-node when falling back to a bundler-mode tsconfig in a commonjs project', async () => {
      const appDir = path.join(fixtures, 'fallback');

      const registered = await registerWithTsNode(appDir, {
        moduleType: 'commonjs',
      });

      expect(registered.project).toBe(path.join(appDir, 'tsconfig.json'));
      expect(registered.compilerOptions).toEqual({
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
      });
    });

    it('should let ts-node compilerOptions from tsconfig win over the forced overrides', async () => {
      const appDir = path.join(fixtures, 'fallback');

      const registered = await registerWithTsNode(
        appDir,
        { moduleType: 'commonjs' },
        { 'ts-node': { compilerOptions: { module: 'commonjs' } } },
      );

      expect(registered.compilerOptions).toEqual({
        module: 'commonjs',
        moduleResolution: 'NodeNext',
      });
    });

    it('should not force overrides for type: module projects', async () => {
      const appDir = path.join(fixtures, 'fallback');

      const registered = await registerWithTsNode(appDir, {
        moduleType: 'module',
      });

      expect(registered.project).toBe(path.join(appDir, 'tsconfig.json'));
      expect(registered).not.toHaveProperty('compilerOptions');
      expect(mockRegisterModuleHooks).toBeCalledWith(
        expect.objectContaining({
          tsconfigPath: path.join(appDir, 'tsconfig.json'),
          compilerOptions: {},
        }),
      );
    });

    it('should skip the project and pass merged options when the chain has an extends array', async () => {
      // ts-node 10.x cannot parse `extends: [...]`, so the framework resolves
      // the chain itself and registers ts-node without a project file.
      const appDir = path.join(fixtures, 'convention-array');

      const registered = await registerWithTsNode(appDir, {
        moduleType: 'commonjs',
      });

      expect(registered).not.toHaveProperty('project');
      expect(registered.skipProject).toBe(true);
      expect(registered.scopeDir).toBe(appDir);
      expect(registered.compilerOptions).toEqual({
        // main config
        strict: true,
        // server preset (later extends entry) over the main config
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        // `ts-node.compilerOptions` from the file still wins
        target: 'ES2020',
      });
      // path / emit options never reach ts-node
      expect(registered.compilerOptions).not.toHaveProperty('baseUrl');
      expect(registered.compilerOptions).not.toHaveProperty('paths');
      expect(registered.compilerOptions).not.toHaveProperty('noEmit');
      expect(registered.compilerOptions).not.toHaveProperty('declaration');
    });

    it('should hand the esm loader merged options instead of a project it cannot read', async () => {
      const appDir = path.join(fixtures, 'convention-array');

      await registerWithTsNode(appDir, { moduleType: 'module' });

      expect(mockRegisterModuleHooks).toBeCalledWith(
        expect.objectContaining({
          tsconfigPath: undefined,
          compilerOptions: expect.objectContaining({
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            strict: true,
          }),
        }),
      );
    });

    it('should prefer tsconfig.server.json by convention without overrides', async () => {
      const appDir = path.join(fixtures, 'convention');

      const registered = await registerWithTsNode(appDir, {
        moduleType: 'commonjs',
      });

      expect(registered.project).toBe(
        path.join(appDir, 'tsconfig.server.json'),
      );
      expect(registered).not.toHaveProperty('compilerOptions');
      expect(mockReadTsConfigByFile).toBeCalledWith(
        path.join(appDir, 'tsconfig.server.json'),
      );
      expect(mockGetAliasConfig).toBeCalledWith(
        [],
        expect.objectContaining({
          tsconfigPath: path.join(appDir, 'tsconfig.server.json'),
        }),
      );
    });

    it('should prefer an explicit server.tsconfigPath over the convention file', async () => {
      const appDir = path.join(fixtures, 'convention');

      const registered = await registerWithTsNode(appDir, {
        moduleType: 'commonjs',
        tsconfigPath: 'tsconfig.json',
      });

      // Explicit files are trusted as-is, even when they would emit ESM.
      expect(registered.project).toBe(path.join(appDir, 'tsconfig.json'));
      expect(registered).not.toHaveProperty('compilerOptions');
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
