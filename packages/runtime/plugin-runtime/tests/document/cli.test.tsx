import { existsSync } from 'fs';
import path from 'path';
import {
  type CLIPluginAPI,
  type Plugin,
  createPluginManager,
} from '@modern-js/plugin';
import { createContext, initPluginAPI } from '@modern-js/plugin/cli';

import type { AppTools, AppToolsContext } from '@modern-js/app-tools';
import { getBundleEntry } from '../../../../solutions/app-tools/src/plugins/analyze/getBundleEntry';
import { documentPlugin, getDocumentByEntryName } from '../../src/document/cli';

describe('plugin runtime cli', () => {
  let pluginAPI: CLIPluginAPI<AppTools>;
  const setup = async ({ appDirectory }: { appDirectory: string }) => {
    const pluginManager = createPluginManager();
    pluginManager.addPlugins([documentPlugin() as Plugin]);
    const plugins = pluginManager.getPlugins();
    const context = await createContext<AppTools>({
      appContext: {
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
      await plugin?.setup?.(pluginAPI);
    }
  };
  beforeAll(async () => {
    await setup({ appDirectory: path.join(__dirname, './feature') });
  });
  it('plugin is defined', () => {
    expect(documentPlugin).toBeDefined();
  });

  it('plugin-document cli config is defined', async () => {
    const hooks = pluginAPI.getHooks();
    const config = await hooks.config.call();
    expect(config.find((item: any) => item.tools)).toBeTruthy();
    expect(config.find((item: any) => item.tools.htmlPlugin)).toBeTruthy();
  });

  it('plugin-document htmlPlugin can return the right', async () => {
    pluginAPI.updateAppContext({
      internalDirectory: path.join(__dirname, './feature'),
      appDirectory: path.join(__dirname, './feature'),
      entrypoints: [
        {
          entryName: 'main',
          absoluteEntryDir: path.join(__dirname, './feature'),
        },
      ],
    });
    const hooks = pluginAPI.getHooks();
    const config = await hooks.config.call();
    const { htmlPlugin } = (
      config.find((item: any) => item.tools.htmlPlugin)! as any
    ).tools;

    const mockBuilderOptions = {
      templateParameters: () => {
        return {
          title: 'abc',
        };
      },
      k: 'k',
    };
    const result = htmlPlugin(mockBuilderOptions, { entryName: 'main' });

    // mock renderer to bypass child-compiler output in unit test
    (global as any).__MODERN_DOC_RENDERERS__ = {
      main: () => '<html><head></head><body>mock</body></html>',
    };

    expect(result.k).toEqual(mockBuilderOptions.k);
    expect(result.templateParameters).toEqual(
      mockBuilderOptions.templateParameters,
    );
    expect(Object.keys(result).length > 2).toBeTruthy();
    const htmlPluginFn = result.templateContent;

    const html = await htmlPluginFn({
      htmlPlugin: {
        tags: {
          headTags: [],
          bodyTags: '',
        },
      },
    });
    expect(html.includes('<!DOCTYPE html>')).toBeTruthy();
  });
  it('when user config set empty entries and disableDefaultEntries true, should get the ', async () => {
    const hooks: any = pluginAPI.getHooks();
    const entries = await getBundleEntry(
      hooks,
      {
        internalDirectory: path.join(__dirname, './feature'),
        appDirectory: path.join(__dirname, './feature'),
      } as AppToolsContext,
      {
        source: {
          disableDefaultEntries: true,
        },
      } as any,
    );
    // empty entries
    expect(entries.length).toEqual(0);
    const documentFile = getDocumentByEntryName(
      [],
      'main',
      path.join(__dirname, './feature'),
    );
    // get the default /src/Document.tsx file
    expect(documentFile).toEqual(
      `${path.join(__dirname, './feature', './src/Document.tsx')}`,
    );
  });
});
