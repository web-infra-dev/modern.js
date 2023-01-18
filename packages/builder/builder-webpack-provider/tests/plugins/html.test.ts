import { describe, expect, it } from 'vitest';
import { builderPluginEntry } from '@builder/plugins/entry';
import { getTemplatePath, builderPluginHtml } from '@/plugins/html';
import { createStubBuilder } from '@/stub';
import type { BuilderConfig, NormalizedConfig } from '@/types';

describe('plugins/html', () => {
  it('should register html plugin correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginEntry(), builderPluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(await builder.matchWebpackPlugin('HtmlWebpackPlugin')).toBeTruthy();
    expect(config).toMatchSnapshot();
  });

  it('should not register html plugin when target is node', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginEntry(), builderPluginHtml()],
      target: 'node',
      entry: {
        main: './src/main.ts',
      },
    });
    expect(await builder.matchWebpackPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should not register html plugin when target is web-worker', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginEntry(), builderPluginHtml()],
      target: 'web-worker',
      entry: {
        main: './src/main.ts',
      },
    });
    expect(await builder.matchWebpackPlugin('HtmlWebpackPlugin')).toBeFalsy();
  });

  it('should register crossorigin plugin when using html.crossorigin', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginEntry(), builderPluginHtml()],
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
      plugins: [builderPluginEntry(), builderPluginHtml()],
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
      plugins: [builderPluginEntry(), builderPluginHtml()],
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
      plugins: [builderPluginEntry(), builderPluginHtml()],
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
      plugins: [builderPluginEntry(), builderPluginHtml()],
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
      plugins: [builderPluginEntry(), builderPluginHtml()],
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
      plugins: [builderPluginEntry(), builderPluginHtml()],
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
    const templatePath = getTemplatePath(entry, { html } as NormalizedConfig);
    expect(templatePath).toEqual(expected);
  });

  it('should support multi entry', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginEntry(), builderPluginHtml()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      builderConfig: {
        html: {
          template: 'bar',
          templateByEntries: { main: 'foo' },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should add one tags plugin instance', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginEntry(), builderPluginHtml()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      builderConfig: {
        html: {
          tags: { tag: 'script', attrs: { src: 'jq.js' } },
          tagsByEntries: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    const plugins = config.plugins?.filter(p => p.name === 'HtmlTagsPlugin');
    expect(plugins?.length).toBe(1);
    expect(config).toMatchSnapshot();
  });

  it('should add tags plugin instances for each entries', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginEntry(), builderPluginHtml()],
      entry: {
        main: './src/main.ts',
        foo: './src/foo.ts',
      },
      builderConfig: {
        html: {
          tags: [{ tag: 'script', attrs: { src: 'jq.js' } }],
          tagsByEntries: {
            foo: [{ tag: 'script', attrs: { src: 'foo.js' } }],
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    const plugins = config.plugins?.filter(p => p.name === 'HtmlTagsPlugin');
    expect(plugins?.length).toBe(2);
    expect(config).toMatchSnapshot();
  });
});
