import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should apply defer by default', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find(file => file.endsWith('index.html'))!];

  expect(html).toContain('<script defer="defer" src="');
});

test('should remove defer when scriptLoading is "blocking"', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      html: {
        scriptLoading: 'blocking',
      },
    },
  });
  const files = await builder.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find(file => file.endsWith('index.html'))!];

  expect(html).toContain('<script src="');
});

test('should allow to set scriptLoading to "module"', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      html: {
        scriptLoading: 'module',
      },
    },
  });
  const files = await builder.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find(file => file.endsWith('index.html'))!];

  expect(html).toContain('<script type="module" src="');
});
