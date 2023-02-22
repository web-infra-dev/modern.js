import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should emit local favicon to dist path', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      html: {
        favicon: './src/icon.png',
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  expect(
    Object.keys(files).some(file => file.endsWith('/icon.png')),
  ).toBeTruthy();

  const html =
    files[Object.keys(files).find(file => file.endsWith('index.html'))!];

  expect(html).toContain('<link rel="icon" href="/icon.png">');
});

test('should apply asset prefix to favicon URL', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      html: {
        favicon: './src/icon.png',
      },
      output: {
        assetPrefix: 'https://www.example.com',
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find(file => file.endsWith('index.html'))!];

  expect(html).toContain(
    '<link rel="icon" href="https://www.example.com/icon.png">',
  );
});

test('should allow favicon to be a CDN URL', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      html: {
        favicon: 'https://foo.com/icon.png',
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find(file => file.endsWith('index.html'))!];

  expect(html).toContain('<link rel="icon" href="https://foo.com/icon.png">');
});
