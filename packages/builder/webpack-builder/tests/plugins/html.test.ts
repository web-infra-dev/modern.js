import { expect, describe, it } from 'vitest';
import { PluginHtml } from '../../src/plugins/html';
import { PluginEntry } from '../../src/plugins/entry';
import { createStubBuilder } from '../../src/stub';

describe('plugins/html', () => {
  it('should register html plugin correctly', async () => {
    const builder = createStubBuilder({
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
    const builder = createStubBuilder({
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
    const builder = createStubBuilder({
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
    const builder = createStubBuilder({
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
    const builder = createStubBuilder({
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

    const builder = createStubBuilder({
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
    const builder = createStubBuilder({
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

  it('should not register html plugin for vendorEntry', async () => {
    const builder = createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        source: {
          vendorEntry: {
            polyfill: './src/polyfill.ts',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    const { default: HtmlWebpackPlugin } = await import('html-webpack-plugin');
    const htmlPlugins = (config.plugins || []).filter(
      p => p instanceof HtmlWebpackPlugin,
    );
    // only main entry has corresponding html plugin
    expect(htmlPlugins).toHaveLength(1);
  });

  it('should add all vendorEntry to html plugin chunks by default', async () => {
    const builder = createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        foo: './src/foo.ts',
        bar: './src/bar.ts',
      },
      builderConfig: {
        source: {
          vendorEntry: {
            polyfill: './src/polyfill.ts',
            react: ['react', 'react-dom'],
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    const { default: HtmlWebpackPlugin } = await import('html-webpack-plugin');
    const htmlPlugins = (config.plugins || []).filter(
      p => p instanceof HtmlWebpackPlugin,
    ) as Array<InstanceType<typeof HtmlWebpackPlugin>>;

    // chunks should contain all entries defined by vendorEntry
    for (const plugin of htmlPlugins) {
      expect(plugin.userOptions.chunks).toContain('polyfill');
      expect(plugin.userOptions.chunks).toContain('react');
    }
  });
});
