import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { RUNTIME_CHUNK_NAME } from '@modern-js/builder-shared';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

const isRuntimeChunkInHtml = (html: string): boolean =>
  Boolean(
    html.match(new RegExp(`static/js/${RUNTIME_CHUNK_NAME}\\.(.+)\\.js\\.map`)),
  );

test('inline runtime chunk by default', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();

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

test('inline runtime chunk by default with multiple entries', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: {
      index: path.resolve('./src/index.js'),
      another: path.resolve('./src/another.js'),
    },
  });
  const files = await builder.unwrapOutputJSON();

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

test('inline all scripts and emit all source maps', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: {
      index: path.resolve('./src/index.js'),
      another: path.resolve('./src/another.js'),
    },
    builderConfig: {
      output: {
        enableInlineScripts: true,
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

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
