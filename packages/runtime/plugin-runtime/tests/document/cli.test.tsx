import path from 'path';
import { existsSync } from 'fs';
import { manager } from '@modern-js/core';

import plugin from '../../src/document/cli';

describe('plugin runtime cli', () => {
  const main = manager.clone().usePlugin(plugin);
  let runner: any;

  beforeAll(async () => {
    runner = await main.init();
  });

  it('plugin is defined', () => {
    expect(plugin).toBeDefined();
  });

  it('plugin-document cli config is defined', async () => {
    const config = await runner.config();
    expect(config.find((item: any) => item.tools)).toBeTruthy();
    expect(config.find((item: any) => item.tools.htmlPlugin)).toBeTruthy();
  });

  it('plugin-document htmlPlugin can return the right', async () => {
    const mockAPI = {
      useAppContext: jest.fn((): any => ({
        internalDirectory: path.join(__dirname, './feature'),
        entrypoints: [
          {
            entryName: 'main',
            absoluteEntryDir: path.join(__dirname, './feature'),
          },
        ],
      })),
      useResolvedConfigContext: jest.fn(),
    };
    const cloned = manager.clone(mockAPI);
    cloned.usePlugin(plugin);
    const runner2 = await cloned.init();
    const config = await runner2.config();

    const { htmlPlugin } = config.find(
      (item: any) => item.tools.htmlPlugin,
    )!.tools;

    const mockBuilderOptions = {
      templateParameters: () => {
        return {
          title: 'abc',
        };
      },
      k: 'k',
    };
    const result = htmlPlugin(mockBuilderOptions, { entryName: 'main' });

    expect(result.k).toEqual(mockBuilderOptions.k);
    expect(result.templateParameters).toEqual(
      mockBuilderOptions.templateParameters,
    );
    expect(Object.keys(result).length > 2).toBeTruthy();
    const htmlPluginFn = result.templateContent;

    const html = await htmlPluginFn({
      htmlWebpackPlugin: {
        tags: {
          headTags: [],
          bodyTags: '',
        },
      },
    });
    expect(html.includes('<!DOCTYPE html>')).toBeTruthy();
    // the html file should existed
    expect(
      existsSync(path.join(__dirname, './feature/document/_main.html.js')),
    ).toBeTruthy();
  });
});
