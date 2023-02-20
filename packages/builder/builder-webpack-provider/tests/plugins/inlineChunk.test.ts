import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import { builderPluginEntry } from '@builder/plugins/entry';
import { builderPluginHtml } from '@builder/plugins/html';
import { builderPluginInlineChunk } from '@/plugins/inlineChunk';
import { createStubBuilder } from '@/stub';

describe('plugins/inlineChunk', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = '';
  });

  it('should add InlineChunkHtmlPlugin properly by default', async () => {
    const builder = await createStubBuilder({
      plugins: [
        builderPluginEntry(),
        builderPluginHtml(),
        builderPluginInlineChunk(),
      ],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should use proper plugin options when enableInlineScripts is true', async () => {
    const builder = await createStubBuilder({
      plugins: [
        builderPluginEntry(),
        builderPluginHtml(),
        builderPluginInlineChunk(),
      ],
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
      plugins: [
        builderPluginEntry(),
        builderPluginHtml(),
        builderPluginInlineChunk(),
      ],
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
      plugins: [
        builderPluginEntry(),
        builderPluginHtml(),
        builderPluginInlineChunk(),
      ],
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
      plugins: [
        builderPluginEntry(),
        builderPluginHtml(),
        builderPluginInlineChunk(),
      ],
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
      plugins: [
        builderPluginEntry(),
        builderPluginHtml(),
        builderPluginInlineChunk(),
      ],
      entry: {
        main: './src/main.ts',
      },
      target: 'web-worker',
    });

    expect(
      await builder.matchWebpackPlugin('InlineChunkHtmlPlugin'),
    ).toBeFalsy();
  });

  it('should not apply InlineChunkHtmlPlugin in development mode', async () => {
    process.env.NODE_ENV = 'development';
    const builder = await createStubBuilder({
      plugins: [
        builderPluginEntry(),
        builderPluginHtml(),
        builderPluginInlineChunk(),
      ],
      entry: {
        main: './src/main.ts',
      },
    });

    expect(
      await builder.matchWebpackPlugin('InlineChunkHtmlPlugin'),
    ).toBeFalsy();
  });
});
