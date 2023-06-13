import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '@scripts/shared';
import { RUNTIME_CHUNK_NAME } from '@modern-js/builder-shared';

// todo: Rspack not output RUNTIME_CHUNK_NAME.js.map
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

webpackOnlyTest('inline runtime chunk by default', async ({ page }) => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    runServer: true,
    builderConfig: {
      tools: toolsConfig,
    },
  });

  // test runtime
  await page.goto(getHrefByEntryName('index', builder.port));

  expect(await page.evaluate(`window.test`)).toBe('aaaa');

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

  builder.close();
});

webpackOnlyTest(
  'inline runtime chunk by default with multiple entries',
  async () => {
    const builder = await build({
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.js'),
        another: path.resolve(__dirname, './src/another.js'),
      },
      builderConfig: {
        tools: toolsConfig,
      },
    });
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

webpackOnlyTest(
  'inline all scripts and emit all source maps',
  async ({ page }) => {
    const builder = await build({
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.js'),
        another: path.resolve(__dirname, './src/another.js'),
      },
      runServer: true,
      builderConfig: {
        output: {
          enableInlineScripts: true,
        },
        tools: toolsConfig,
      },
    });

    await page.goto(getHrefByEntryName('index', builder.port));

    // test runtime
    expect(await page.evaluate(`window.test`)).toBe('aaaa');

    const files = await builder.unwrapOutputJSON(false);

    // no entry chunks or runtime chunks in output
    expect(
      Object.keys(files).filter(
        fileName => fileName.endsWith('.js') && !fileName.includes('/async/'),
      ).length,
    ).toEqual(0);

    // all source maps in output
    expect(
      Object.keys(files).filter(fileName => fileName.endsWith('.js.map'))
        .length,
    ).toEqual(4);

    builder.close();
  },
);

webpackOnlyTest('using RegExp to inline scripts', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    builderConfig: {
      output: {
        enableInlineScripts: /\/main\.\w+\.js$/,
      },
      tools: toolsConfig,
    },
  });
  const files = await builder.unwrapOutputJSON(false);

  // no main.js in output
  expect(
    Object.keys(files).filter(
      fileName => fileName.endsWith('.js') && fileName.includes('/main.'),
    ).length,
  ).toEqual(0);

  // all source maps in output
  expect(
    Object.keys(files).filter(fileName => fileName.endsWith('.js.map')).length,
  ).toEqual(3);
});

webpackOnlyTest('using RegExp to inline styles', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    builderConfig: {
      output: {
        enableInlineStyles: /\/main\.\w+\.css$/,
      },
      tools: toolsConfig,
    },
  });
  const files = await builder.unwrapOutputJSON(false);

  // no main.css in output
  expect(
    Object.keys(files).filter(
      fileName => fileName.endsWith('.css') && fileName.includes('/main.'),
    ).length,
  ).toEqual(0);
});
