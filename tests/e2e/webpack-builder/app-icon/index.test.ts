import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should emit app icon to dist path', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
    builderConfig: {
      html: {
        appIcon: './src/icon.png',
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  expect(
    Object.keys(files).some(file => file.endsWith('static/image/icon.png')),
  ).toBeTruthy();

  const html =
    files[Object.keys(files).find(file => file.endsWith('index.html'))!];

  expect(html).toContain(
    '<link rel="apple-touch-icon" sizes="180*180" href="/static/image/icon.png">',
  );
});

test('should apploy asset prefix to app icon URL', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
    builderConfig: {
      html: {
        appIcon: './src/icon.png',
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
    '<link rel="apple-touch-icon" sizes="180*180" href="https://www.example.com/static/image/icon.png">',
  );
});
