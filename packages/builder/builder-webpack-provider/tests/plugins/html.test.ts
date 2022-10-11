import { expect, describe, it } from 'vitest';
import { getTemplatePath, PluginHtml } from '../../src/plugins/html';
import { PluginEntry } from '../../src/plugins/entry';
import { createStubBuilder } from '../../src/stub';
import { BuilderConfig } from '../../src/types';

describe('plugins/html', () => {
  it('should register html plugin correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(await builder.matchWebpackPlugin('HtmlWebpackPlugin')).toBeTruthy();
    expect(config).toMatchSnapshot();
  });

  it('should register crossorigin plugin when using html.crossorigin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        html: {
          crossorigin: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(
      await builder.matchWebpackPlugin('HtmlCrossOriginPlugin'),
    ).toBeTruthy();
    expect(config.output?.crossOriginLoading).toEqual('anonymous');
  });

  it('should register appIcon plugin when using html.appIcon', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        html: {
          appIcon: './src/assets/icon.png',
        },
      },
    });

    expect(await builder.matchWebpackPlugin('HtmlAppIconPlugin')).toBeTruthy();
  });

  it('should allow to set favicon by html.favicon option', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        html: {
          favicon: './src/favicon.ico',
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to set inject by html.inject option', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        html: {
          inject: 'body',
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should enable minify in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to modify plugin options by tools.htmlPlugin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        tools: {
          htmlPlugin(_config, utils) {
            expect(utils.entryName).toEqual('main');
            return {
              inject: true,
            };
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to disable html plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        tools: {
          htmlPlugin: false,
        },
      },
    });

    expect(await builder.matchWebpackPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it.each<[string, string, BuilderConfig['html']]>([
    ['main', 'foo', { template: 'foo' }],
    ['main', 'foo', { templateByEntries: { main: 'foo' } }],
    ['other', 'bar', { template: 'bar', templateByEntries: { main: 'foo' } }],
  ])(`should get template path for %s`, async (entry, expected, html) => {
    const templ = getTemplatePath(entry, { html });
    expect(templ).toEqual(expected);
  });
});
