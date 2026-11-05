import * as utils from '@modern-js/utils' with { rstest: 'importActual' };

const PLUGIN_PATH = '/project/node_modules/modern-plugin/index.js';

const compatibleRequireError = new Error('real error from plugin');

function mockUtils(overrides: Record<string, unknown>) {
  rstest.doMock('@modern-js/utils', () => ({
    __esModule: true,
    ...utils,
    createDebugger: () => () => {},
    tryResolve: () => PLUGIN_PATH,
    getInternalPlugins: (_appDirectory: string, internalPlugins: any) =>
      Object.values(internalPlugins).map((config: any) => config.path),
    ...overrides,
  }));
}

describe('loadInternalPlugins', () => {
  afterEach(() => {
    rstest.resetModules();
    rstest.doUnmock('@modern-js/utils');
  });

  it('loads an ESM-only plugin through a file URL', async () => {
    const dynamicImport = rstest.fn(async () => ({
      default: () => ({ name: 'esm-plugin' }),
    }));
    mockUtils({
      compatibleRequire: async () => {
        throw new Error('require() of ES Module not supported');
      },
      dynamicImport,
    });

    const { loadInternalPlugins } = await import('../../src/utils/loadPlugins');
    const plugins = await loadInternalPlugins(process.cwd(), {
      'modern-plugin': { path: PLUGIN_PATH, forced: true },
    });

    expect(plugins).toEqual([{ name: 'esm-plugin' }]);
    expect(dynamicImport).toHaveBeenCalledWith(
      'file:///project/node_modules/modern-plugin/index.js',
    );
  });

  it('rethrows the original error when the ESM fallback fails too', async () => {
    mockUtils({
      compatibleRequire: async () => {
        throw compatibleRequireError;
      },
      dynamicImport: async () => {
        throw new Error(
          "Only URLs with a scheme in: file, data, and node are supported by the default ESM loader. Received protocol 'c:'",
        );
      },
    });

    const { loadInternalPlugins } = await import('../../src/utils/loadPlugins');

    await expect(
      loadInternalPlugins(process.cwd(), {
        'modern-plugin': { path: PLUGIN_PATH, forced: true },
      }),
    ).rejects.toThrow('real error from plugin');
  });
});
