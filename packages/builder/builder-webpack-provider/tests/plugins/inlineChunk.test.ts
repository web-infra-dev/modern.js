import { expect, describe, it } from 'vitest';
import { PluginEntry } from '../../src/plugins/entry';
import { PluginHtml } from '../../src/plugins/html';
import { PluginInlineChunk } from '../../src/plugins/inlineChunk';
import { createStubBuilder } from '../../src/stub';

describe('plugins/inlineChunk', () => {
  it('should add InlineChunkHtmlPlugin properly by default', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml(), PluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should use proper plugin options when enableInlineScripts is true', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml(), PluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        output: {
          enableInlineScripts: true,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should use proper plugin options when enableInlineStyles is true', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml(), PluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        output: {
          enableInlineStyles: true,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should use proper plugin options when disableInlineRuntimeChunk is true', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml(), PluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        output: {
          disableInlineRuntimeChunk: true,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not apply InlineChunkHtmlPlugin when target is node', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml(), PluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      target: 'node',
    });

    expect(
      await builder.matchWebpackPlugin('InlineChunkHtmlPlugin'),
    ).toBeFalsy();
  });

  it('should not apply InlineChunkHtmlPlugin when target is web-worker', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginHtml(), PluginInlineChunk()],
      entry: {
        main: './src/main.ts',
      },
      target: 'web-worker',
    });

    expect(
      await builder.matchWebpackPlugin('InlineChunkHtmlPlugin'),
    ).toBeFalsy();
  });
});
