import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { RUNTIME_CHUNK_NAME } from '@modern-js/builder-shared';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

const isRuntimeChunkInHtml = (html: string): boolean =>
  Boolean(
    html.match(new RegExp(`static/js/${RUNTIME_CHUNK_NAME}\\.(.+)\\.js\\.map`)),
  );

// use source-map for easy to test. By default, builder use hidden-source-map
const toolsConfig = {
  webpack: (config: any) => {
    config.devtool = 'source-map';
  },
  rspack: (config: any) => {
    config.devtool = 'source-map';
  },
};

webpackOnlyTest('inline runtime chunk by default', async () => {
  const builder = await build(
    {
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
    },
    {
      tools: toolsConfig,
    },
    false,
  );
  const files = await builder.unwrapOutputJSON(false);

  // no builder-runtime file in output
  expect(
    Object.keys(files).some(
      fileName =>
        fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js'),
    ),
  ).toBe(false);

  // should emit source map of builder runtime
  expect(
    Object.keys(files).some(
      fileName =>
        fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js.map'),
    ),
  ).toBe(true);

  // found builder-runtime file in html
  const indexHtml =
    files[path.resolve(__dirname, './dist/html/index/index.html')];

  expect(isRuntimeChunkInHtml(indexHtml)).toBeTruthy();
});

webpackOnlyTest(
  'inline runtime chunk by default with multiple entries',
  async () => {
    const builder = await build(
      {
        cwd: __dirname,
        entry: {
          index: path.resolve(__dirname, './src/index.js'),
          another: path.resolve(__dirname, './src/another.js'),
        },
      },
      {
        tools: toolsConfig,
      },
      false,
    );
    const files = await builder.unwrapOutputJSON(false);

    // no builder-runtime file in output
    expect(
      Object.keys(files).some(
        fileName =>
          fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js'),
      ),
    ).toBe(false);

    // found builder-runtime file in html
    const indexHtml =
      files[path.resolve(__dirname, './dist/html/index/index.html')];
    const anotherHtml =
      files[path.resolve(__dirname, './dist/html/another/index.html')];

    expect(isRuntimeChunkInHtml(indexHtml)).toBeTruthy();
    expect(isRuntimeChunkInHtml(anotherHtml)).toBeTruthy();
  },
);

webpackOnlyTest('inline all scripts and emit all source maps', async () => {
  const builder = await build(
    {
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.js'),
        another: path.resolve(__dirname, './src/another.js'),
      },
    },
    {
      output: {
        enableInlineScripts: true,
      },
      tools: toolsConfig,
    },
    false,
  );
  const files = await builder.unwrapOutputJSON(false);

  // no entry chunks or runtime chunks in output
  expect(
    Object.keys(files).filter(
      fileName => fileName.endsWith('.js') && !fileName.includes('/async/'),
    ).length,
  ).toEqual(0);

  // all source maps in output
  expect(
    Object.keys(files).filter(fileName => fileName.endsWith('.js.map')).length,
  ).toEqual(5);
});
