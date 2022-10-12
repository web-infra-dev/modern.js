import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { RUNTIME_CHUNK_NAME } from '@modern-js/builder-shared';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('inline runtime chunk by default', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();

  // no builder-runtime file in output
  expect(
    Object.keys(files).some(fileName => fileName.includes(RUNTIME_CHUNK_NAME)),
  ).toBe(false);

  // found builder-runtime file in html
  const indexHtml =
    files[path.resolve(__dirname, './dist/html/index/index.html')];

  expect(
    indexHtml.match(new RegExp(`${RUNTIME_CHUNK_NAME}\\.(.+)\\.js\\.map`)),
  ).toBeTruthy();
});
