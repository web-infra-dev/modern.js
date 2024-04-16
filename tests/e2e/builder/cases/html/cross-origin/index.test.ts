import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should not apply crossOrigin by default', async () => {
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

  expect(html).not.toContain('crossorigin');
});

test('should apply crossOrigin when crossorigin is "anonymous" and not same origin', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      html: {
        scriptLoading: 'blocking',
        crossorigin: 'anonymous',
      },
      output: {
        assetPrefix: '//aaaa.com',
      },
    },
  });
  const files = await builder.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find(file => file.endsWith('index.html'))!];

  expect(html).toContain('crossorigin="anonymous"></script>');
});
