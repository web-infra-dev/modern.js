import path from 'node:path';
import type { InternalPlugins } from '@modern-js/types';
import { loadInternalPlugins } from '../../src/utils/loadPlugins';

const mockCompatibleRequire = rstest.fn();
const mockDynamicImport = rstest.fn();

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
  const appDirectory = path.resolve('test-app');

  beforeEach(() => {
    mockCompatibleRequire.mockReset();
    mockDynamicImport.mockReset();
  });

  const loadPlugin = (pluginPath: string) =>
    loadInternalPlugins(appDirectory, {
      'test-plugin': { path: pluginPath, forced: true },
    });

  it.each(['object', 'factory'])(
    'loads a plugin %s through compatibleRequire',
    async exportType => {
      const plugin = { name: 'commonjs-plugin' };
      const factory = rstest.fn(() => plugin);
      mockCompatibleRequire.mockResolvedValue(
        exportType === 'factory' ? factory : plugin,
      );

      const pluginPath = path.join(appDirectory, 'plugin.cjs');
      await expect(loadPlugin(pluginPath)).resolves.toEqual([plugin]);

      expect(mockCompatibleRequire).toHaveBeenCalledWith(pluginPath);
      expect(mockDynamicImport).not.toHaveBeenCalled();
      expect(factory).toHaveBeenCalledTimes(exportType === 'factory' ? 1 : 0);
    },
  );

  it('propagates plugin load errors without retrying the module', async () => {
    const cause = new Error('native addon permission check failed');
    const originalError = Object.assign(
      new Error('real error from plugin', { cause }),
      { code: 'ERR_DLOPEN_FAILED' },
    );
    mockCompatibleRequire.mockRejectedValue(originalError);

    await expect(
      loadPlugin(path.join(appDirectory, 'throwing.cjs')),
    ).rejects.toBe(originalError);
    expect(mockDynamicImport).not.toHaveBeenCalled();
  });
});
