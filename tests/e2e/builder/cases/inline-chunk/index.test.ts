import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build, getHrefByEntryName } from '@scripts/shared';
import { BundlerChain, RUNTIME_CHUNK_NAME } from '@modern-js/builder-shared';

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

  expect(isRuntimeChunkInHtml(indexHtml)).toBeTruthy();

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

  // should not emit source map of builder runtime
  expect(
    Object.keys(files).some(
      fileName =>
        fileName.includes(RUNTIME_CHUNK_NAME) && fileName.endsWith('.js.map'),
    ),
  ).toBe(false);
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
});

webpackOnlyTest(
  'inline all scripts should work and emit all source maps',
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

test('using RegExp to inline scripts', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.js'),
    },
    builderConfig: {
      output: {
        enableInlineScripts: /\/index\.\w+\.js$/,
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
        enableInlineScripts({ size, name }) {
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
        enableInlineStyles: /\/index\.\w+\.css$/,
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
        enableInlineStyles({ size, name }) {
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
