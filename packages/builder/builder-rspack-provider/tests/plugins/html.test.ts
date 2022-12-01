import { expect, describe, it } from 'vitest';
import { PluginHtml } from '../../src/plugins/html';
import { PluginEntry } from '../../src/plugins/entry';
import { createBuilder, matchPlugin } from '../helper';

describe('plugins/html', () => {
  it('should register html plugin correctly', async () => {
    const builder = await createBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should register crossorigin plugin when using html.crossorigin', async () => {
    const builder = await createBuilder({
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

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(
      matchPlugin(bundlerConfigs[0], 'HtmlCrossOriginPlugin'),
    ).toBeDefined();
  });

  it('should register appIcon plugin when using html.appIcon', async () => {
    const builder = await createBuilder({
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

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(matchPlugin(bundlerConfigs[0], 'HtmlAppIconPlugin')).toBeDefined();
  });

  it('should allow to set favicon by html.favicon option', async () => {
    const builder = await createBuilder({
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
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to set inject by html.inject option', async () => {
    const builder = await createBuilder({
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
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should enable minify in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to modify plugin options by tools.htmlPlugin', async () => {
    const builder = await createBuilder({
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
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should support multi entry', async () => {
    const builder = await createBuilder({
      plugins: [PluginEntry(), PluginHtml()],
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
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
    expect(matchPlugin(bundlerConfigs[0], 'HtmlRspackPlugin')).toBeDefined();
  });

  it('should allow to disable html plugin', async () => {
    const builder = await createBuilder({
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

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(matchPlugin(bundlerConfigs[0], 'HtmlRspackPlugin')).toBeNull();
  });
});
