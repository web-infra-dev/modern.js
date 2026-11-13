import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileFunction, constants } from 'node:vm';
import type { InternalPlugins } from '@modern-js/types';
import { loadInternalPlugins } from '../../src/utils/loadPlugins';

// Bypass the test runner's import hook to exercise Node's file URL handling.
const nativeImport = compileFunction(
  'return import(modulePath)',
  ['modulePath'],
  { importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER },
) as (modulePath: string) => Promise<{ default: unknown }>;
const mockCompatibleRequire = rstest.fn();
const mockDynamicImport = rstest.fn(nativeImport);

rstest.mock('@modern-js/prod-server', () => ({
  loadServerPlugins: rstest.fn(),
}));

rstest.mock('@modern-js/utils', () => ({
  createDebugger: () => () => {},
  compatibleRequire: (modulePath: string) => mockCompatibleRequire(modulePath),
  dynamicImport: (modulePath: string) => mockDynamicImport(modulePath),
  tryResolve: (modulePath: string) => modulePath,
  getInternalPlugins: (_appDirectory: string, plugins: InternalPlugins = {}) =>
    Object.values(plugins).map(config =>
      typeof config === 'string' ? config : config.path,
    ),
}));

describe('loadInternalPlugins', () => {
  let appDirectory: string;

  beforeEach(() => {
    mockCompatibleRequire.mockReset();
    mockDynamicImport.mockReset();
    mockDynamicImport.mockImplementation(nativeImport);
    appDirectory = mkdtempSync(path.join(tmpdir(), 'modern-cli-plugins #%-'));
  });

  afterEach(() => {
    rmSync(appDirectory, { recursive: true, force: true });
  });

  const loadPlugin = (pluginPath: string) =>
    loadInternalPlugins(appDirectory, {
      'test-plugin': { path: pluginPath, forced: true },
    });

  it.each(['object', 'factory'])(
    'loads a CommonJS plugin %s without using the ESM fallback',
    async exportType => {
      const plugin = { name: 'commonjs-plugin' };
      const factory = rstest.fn(() => plugin);
      mockCompatibleRequire.mockResolvedValue(
        exportType === 'factory' ? factory : plugin,
      );

      await expect(
        loadPlugin(path.join(appDirectory, 'plugin.cjs')),
      ).resolves.toEqual([plugin]);

      expect(mockDynamicImport).not.toHaveBeenCalled();
      expect(factory).toHaveBeenCalledTimes(exportType === 'factory' ? 1 : 0);
    },
  );

  it('loads an ESM plugin from a path containing URL-sensitive characters', async () => {
    const pluginPath = path.join(appDirectory, 'plugin #%.mjs');
    writeFileSync(
      pluginPath,
      `await Promise.resolve();
export default () => ({ name: 'esm-plugin' });
`,
    );
    mockCompatibleRequire.mockRejectedValue(
      new Error('require() cannot load this ESM plugin'),
    );

    await expect(loadPlugin(pluginPath)).resolves.toEqual([
      { name: 'esm-plugin' },
    ]);
    expect(mockDynamicImport).toHaveBeenCalledWith(
      pathToFileURL(pluginPath).href,
    );
  });

  it('preserves the original error when the ESM fallback also fails', async () => {
    const cause = new Error('native addon permission check failed');
    const originalError = Object.assign(
      new Error('real error from plugin', { cause }),
      { code: 'ERR_DLOPEN_FAILED' },
    );
    mockCompatibleRequire.mockRejectedValue(originalError);
    mockDynamicImport.mockRejectedValue(new Error('ESM fallback failed'));

    await expect(
      loadPlugin(path.join(appDirectory, 'throwing.cjs')),
    ).rejects.toBe(originalError);
  });
});
