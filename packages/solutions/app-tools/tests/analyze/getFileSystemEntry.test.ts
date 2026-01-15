import path from 'path';
import { type Plugin, createPluginManager } from '@modern-js/plugin';
import { createContext, initPluginAPI } from '@modern-js/plugin/cli';
import { runtimePlugin } from '../../../../runtime/plugin-runtime/src/cli';
import { appTools } from '../../src';
import { handleSetupResult } from '../../src/compat/hooks';
import { getFileSystemEntry } from '../../src/plugins/analyze/getFileSystemEntry';
import type {
  AppNormalizedConfig,
  AppTools,
  AppToolsContext,
} from '../../src/types';

describe('get entrypoints from file system', () => {
  let pluginAPI: any;
  const config = { source: { entriesDir: './src' } };
  const fixtures = path.resolve(__dirname, './fixtures/entries');

  const setup = async ({ appDirectory }: { appDirectory: string }) => {
    const pluginManager = createPluginManager();
    pluginManager.addPlugins([appTools() as Plugin, runtimePlugin() as Plugin]);
    const plugins = pluginManager.getPlugins();
    const context = await createContext<AppTools>({
      appContext: {
        metaName: 'modern-js',
        appDirectory,
        plugins,
      } as any,
      config: {},
      normalizedConfig: { plugins: [] } as any,
    });
    pluginAPI = initPluginAPI<AppTools>({
      context,
      pluginManager,
    });
    context.pluginAPI = pluginAPI;
    for (const plugin of plugins) {
      const setupResult = (await plugin.setup!(pluginAPI)) as any;
      if (setupResult) {
        await handleSetupResult(setupResult, pluginAPI);
      }
    }
  };

  test('should have one entry include src/App', async () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './single-entry'),
    };
    await setup(appContext);
    expect(
      await getFileSystemEntry(
        await pluginAPI.getHooks(),
        appContext as AppToolsContext,
        config as AppNormalizedConfig,
      ),
    ).toMatchObject([
      {
        entryName: 'src',
        entry: path.resolve(fixtures, './single-entry/src/App.tsx'),
        isAutoMount: true,
      },
    ]);
  });

  test(`should have one build entry with isAutoMount false`, async () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './build-entry'),
    };
    await setup(appContext);

    expect(
      await getFileSystemEntry(
        await pluginAPI.getHooks(),
        appContext as AppToolsContext,
        config as AppNormalizedConfig,
      ),
    ).toMatchObject([
      {
        entryName: 'src',
        entry: path.resolve(appContext.appDirectory, './src/entry.jsx'),
        isAutoMount: false,
      },
    ]);
  });

  test(`should have no entry`, async () => {
    const appContext = { appDirectory: path.resolve(fixtures, './no-entry') };
    await setup(appContext);
    await expect(
      getFileSystemEntry(
        await pluginAPI.getHooks(),
        appContext as AppToolsContext,
        config as AppNormalizedConfig,
      ),
    ).rejects.toThrow('There is no valid entry point in the current project!');
  });
});
