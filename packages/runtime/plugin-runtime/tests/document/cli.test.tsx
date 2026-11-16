import { existsSync } from 'fs';
import path from 'path';
import {
  type CLIPluginAPI,
  type Plugin,
  createPluginManager,
} from '@modern-js/plugin';
import { createContext, initPluginAPI } from '@modern-js/plugin/cli';
import { rs } from '@rstest/core';

import type { AppTools, AppToolsContext } from '@modern-js/app-tools';
import { getBundleEntry } from '../../../../solutions/app-tools/src/plugins/analyze/getBundleEntry';
import { documentPlugin, getDocumentByEntryName } from '../../src/document/cli';
import {
  DOCUMENT_SCRIPTS_PLACEHOLDER,
  DOCUMENT_SSRDATASCRIPT_PLACEHOLDER,
  DOCUMENT_SSR_PLACEHOLDER,
  HTML_SSRDATASCRIPT_SEPARATOR,
} from '../../src/document/constants';

describe('plugin runtime cli', () => {
  let pluginAPI: CLIPluginAPI<AppTools>;
  const setup = async ({
    appDirectory,
    normalizedConfig = {},
  }: {
    appDirectory: string;
    normalizedConfig?: Record<string, unknown>;
  }) => {
    const pluginManager = createPluginManager();
    pluginManager.addPlugins([documentPlugin() as Plugin]);
    const plugins = pluginManager.getPlugins();
    const context = await createContext<AppTools>({
      appContext: {
        appDirectory,
        plugins,
      } as any,
      config: {},
      normalizedConfig: { plugins: [], ...normalizedConfig } as any,
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

    const templateParameters = rs.fn(async () => {
      return {
        title: 'abc',
      };
    });
    const mockBuilderOptions = {
      templateParameters,
      k: 'k',
    };
    const result = htmlPlugin(mockBuilderOptions, { entryName: 'main' });

    // mock renderer to bypass child-compiler output in unit test
    let documentParams: any;
    (global as any).__MODERN_DOC_RENDERERS__ = {
      main: (params: any) => {
        documentParams = params;
        return '<html><head></head><body>mock</body></html>';
      },
    };

    expect(result.k).toEqual(mockBuilderOptions.k);
    expect(result.templateParameters).toEqual(
      mockBuilderOptions.templateParameters,
    );
    expect(templateParameters).not.toHaveBeenCalled();
    expect(Object.keys(result).length > 2).toBeTruthy();
    const htmlPluginFn = result.templateContent;

    const compilation: Record<string, unknown> = {};
    compilation.self = compilation;
    const html = await htmlPluginFn({
      compilation,
      htmlPlugin: {
        tags: {
          headTags: [],
          bodyTags: '',
        },
      },
      rspackConfig: { name: 'client' },
      title: 'abc',
      asyncValue: 'resolved',
    });
    expect(html.includes('<!DOCTYPE html>')).toBeTruthy();
    expect(documentParams.templateParams).toEqual({
      title: 'abc',
      asyncValue: 'resolved',
    });
    expect(() => JSON.stringify(documentParams.templateParams)).not.toThrow();
  });
  describe('body tags', () => {
    const entryScript = '<script src="/entry.js" async></script>';
    const runtimeScript = '<script>runtime()</script>';
    const render = async (server: Record<string, unknown>) => {
      await setup({
        appDirectory: path.join(__dirname, './feature'),
        normalizedConfig: { server },
      });
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
      const config = await pluginAPI.getHooks().config.call();
      const { htmlPlugin } = (
        config.find((item: any) => item.tools.htmlPlugin)! as any
      ).tools;
      const { templateContent } = htmlPlugin({}, { entryName: 'main' });
      (global as any).__MODERN_DOC_RENDERERS__ = {
        main: () =>
          [
            '<html><head>',
            DOCUMENT_SCRIPTS_PLACEHOLDER,
            '</head><body><div id="root">',
            DOCUMENT_SSR_PLACEHOLDER,
            '</div>',
            DOCUMENT_SSRDATASCRIPT_PLACEHOLDER,
            '</body></html>',
          ].join(''),
      };
      return templateContent({
        compilation: {},
        htmlPlugin: {
          tags: {
            headTags: [{ tagName: 'script', toString: () => entryScript }],
            bodyTags: { toString: () => runtimeScript },
          },
        },
        rspackConfig: { name: 'client' },
      }) as Promise<string>;
    };

    afterAll(async () => {
      await setup({ appDirectory: path.join(__dirname, './feature') });
    });

    it.each([
      ['ssr: true', { ssr: true }],
      ['ssrByEntries', { ssrByEntries: { main: { mode: 'stream' } } }],
      ['rsc', { rsc: true }],
    ])(
      'keeps them after the SSR data for streaming entries (%s)',
      async (_, server) => {
        const html = await render(server);
        expect(html).toContain(`<head>${entryScript}</head>`);
        expect(html).toContain(
          `${HTML_SSRDATASCRIPT_SEPARATOR}${runtimeScript}</body>`,
        );
      },
    );

    it.each([
      ['no ssr', {}],
      ['string ssr', { ssr: { mode: 'string' } }],
      ['another entry streams', { ssrByEntries: { other: true } }],
    ])(
      'leaves them at the Scripts placeholder otherwise (%s)',
      async (_, server) => {
        const html = await render(server);
        expect(html).toContain(`<head>${entryScript}${runtimeScript}</head>`);
        expect(html).toContain(`${HTML_SSRDATASCRIPT_SEPARATOR}</body>`);
      },
    );
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
