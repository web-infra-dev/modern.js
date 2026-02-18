import path from 'path';
import { type BundlerChain, RUNTIME_CHUNK_NAME } from '@modern-js/builder';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

// Rspack will not output builder runtime source map, but it not necessary
// Identify whether the builder runtime chunk is included through some specific code snippets
const isRuntimeChunkInHtml = (html: string): boolean =>
  Boolean(html.includes('Loading chunk'));

// use source-map for easy to test. By default, builder use hidden-source-map
const toolsConfig = {
  bundlerChain: (chain: BundlerChain) => {
    chain.devtool('source-map');
  },
  htmlPlugin: (config: any) => {
    // minify will remove sourcemap comment
    if (typeof config.minify === 'object') {
      config.minify.minifyJS = false;
      config.minify.minifyCSS = false;
    }
  },
};

test.describe('disableInlineRuntimeChunk', () => {
  let builder: Awaited<ReturnType<typeof build>>;
  let files: Record<string, string>;

  test.beforeAll(async () => {
    builder = await build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      runServer: true,
      builderConfig: {
        tools: toolsConfig,
        output: {
          disableInlineRuntimeChunk: true,
        },
      },
    });

    files = await builder.unwrapOutputJSON(false);
  });

  test.afterAll(async () => {
    builder.close();
  });

  test('should emit builder runtime', async ({ page }) => {
    // test runtime
    await page.goto(getHrefByEntryName('index', builder.port));

    expect(await page.evaluate(`window.test`)).toBe('aaaa');

    // builder-runtime file in output
    expect(
      Object.keys(files).some(
        fileName =>
          fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js'),
      ),
    ).toBe(true);
  });
});

test('inline runtime chunk by default', async ({ page }) => {
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

  // builder runtime file is emitted in output
  expect(
    Object.keys(files).some(
      fileName =>
        fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js'),
    ),
  ).toBe(true);

  // builder runtime is referenced externally instead of inlined
  const indexHtml =
    files[path.resolve(__dirname, './dist/html/index/index.html')];

  expect(isRuntimeChunkInHtml(indexHtml)).toBeFalsy();

  builder.close();
});

test('inline runtime chunk and remove source map when devtool is "hidden-source-map"', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      tools: {
        bundlerChain(chain) {
          chain.devtool('hidden-source-map');
        },
      },
    },
  });

  const files = await builder.unwrapOutputJSON(false);

  // builder runtime source map is emitted
  expect(
    Object.keys(files).some(
      fileName =>
        fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js.map'),
    ),
  ).toBe(true);
});

test('inline runtime chunk by default with multiple entries', async () => {
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

  // builder runtime file is emitted in output
  expect(
    Object.keys(files).some(
      fileName =>
        fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js'),
    ),
  ).toBe(true);

  // builder runtime is referenced externally instead of inlined
  const indexHtml =
    files[path.resolve(__dirname, './dist/html/index/index.html')];
  const anotherHtml =
    files[path.resolve(__dirname, './dist/html/another/index.html')];

  expect(isRuntimeChunkInHtml(indexHtml)).toBeFalsy();
  expect(isRuntimeChunkInHtml(anotherHtml)).toBeFalsy();
});

test('using RegExp to inline scripts', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    builderConfig: {
      output: {
        inlineScripts: /\/index\.\w+\.js$/,
      },
      tools: toolsConfig,
    },
  });
  const files = await builder.unwrapOutputJSON(false);

  // no index.js in output
  expect(
    Object.keys(files).filter(
      fileName => fileName.endsWith('.js') && fileName.includes('/index.'),
    ).length,
  ).toEqual(0);

  // all source maps in output
  expect(
    Object.keys(files).filter(fileName => fileName.endsWith('.js.map')).length,
  ).toBeGreaterThanOrEqual(2);
});

test('inline scripts by filename and file size', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    builderConfig: {
      output: {
        inlineScripts({ size, name }) {
          return name.includes('index') && size < 1000;
        },
      },
      tools: toolsConfig,
    },
  });
  const files = await builder.unwrapOutputJSON(false);

  // no index.js in output
  expect(
    Object.keys(files).filter(
      fileName => fileName.endsWith('.js') && fileName.includes('/index.'),
    ).length,
  ).toEqual(0);

  // all source maps in output
  expect(
    Object.keys(files).filter(fileName => fileName.endsWith('.js.map')).length,
  ).toBeGreaterThanOrEqual(2);
});

test('using RegExp to inline styles', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    builderConfig: {
      output: {
        inlineStyles: /\/index\.\w+\.css$/,
      },
      tools: toolsConfig,
    },
  });
  const files = await builder.unwrapOutputJSON(false);

  // no index.css in output
  expect(
    Object.keys(files).filter(
      fileName => fileName.endsWith('.css') && fileName.includes('/index.'),
    ).length,
  ).toEqual(0);
});

test('inline styles by filename and file size', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    builderConfig: {
      output: {
        inlineStyles({ size, name }) {
          return name.includes('index') && size < 1000;
        },
      },
      tools: toolsConfig,
    },
  });
  const files = await builder.unwrapOutputJSON(false);

  // no index.css in output
  expect(
    Object.keys(files).filter(
      fileName => fileName.endsWith('.css') && fileName.includes('/index.'),
    ).length,
  ).toEqual(0);
});
