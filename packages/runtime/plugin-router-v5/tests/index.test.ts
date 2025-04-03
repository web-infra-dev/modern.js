import type { AppTools } from '@modern-js/app-tools';
import runtimePlugin from '@modern-js/app-tools/runtime/cli';
import { createPluginManager } from '@modern-js/plugin-v2';
import { createContext, initPluginAPI } from '@modern-js/plugin-v2/cli';
import plugin, { useHistory, useParams } from '../src';
import cliPlugin from '../src/cli';

describe('plugin-router-legacy', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(useHistory).toBeDefined();
    expect(useParams).toBeDefined();
  });
});

describe('cli-router-legacy', () => {
  const setup = async () => {
    const pluginManager = createPluginManager();
    pluginManager.addPlugins([runtimePlugin(), cliPlugin() as any]);
    const plugins = pluginManager.getPlugins();
    const context = await createContext<AppTools>({
      appContext: {
        plugins,
      } as any,
      config: { runtime: true },
      normalizedConfig: { plugins: [], runtime: true } as any,
    });
    const pluginAPI = {
      ...initPluginAPI<AppTools>({
        context,
        pluginManager,
      }),
      checkEntryPoint: ({ path, entry }: any) => {
        return { path, entry };
      },
      modifyEntrypoints: ({ entrypoints }: any) => {
        return { entrypoints };
      },
      generateEntryCode: async ({ entrypoints }: any) => {},
      _internalRuntimePlugins: ({ entrypoint, plugins }: any) => {
        return { entrypoint, plugins };
      },
      addRuntimeExports: () => {},
      modifyFileSystemRoutes: () => {},
      onBeforeGenerateRoutes: () => {},
    };
    context.pluginAPI = pluginAPI as any;
    for (const plugin of plugins) {
      await plugin.setup!(pluginAPI);
    }
    return pluginAPI;
  };

  test('should plugin-router-legacy defined', async () => {
    expect(cliPlugin).toBeDefined();
  });

  it('plugin-router-legacy cli config is defined', async () => {
    const api = await setup();
    api.updateAppContext({ metaName: 'modern-js' } as any);
    const config = await api.getHooks().config.call();
    expect(
      config.find(
        (item: any) => item.source.alias['@modern-js/runtime/plugins'],
      ),
    ).toBeTruthy();
  });
});
