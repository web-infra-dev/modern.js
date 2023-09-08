import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('builder injection script order should be as expected', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      html: {
        inject: false,
        template: './static/index.html',
      },
      output: {
        assetsRetry: {
          inlineScript: false,
        },
        disableInlineRuntimeChunk: true,
        convertToRem: {
          inlineRuntime: false,
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find(file => file.endsWith('index.html'))!];

  // assetsRetry => rem => normal resource => template custom resource
  expect(
    /(<script src="\/static\/js\/assets-retry).*(<script src="\/static\/js\/convert-rem).*(\/static\/js\/index).*(example.com\/assets\/a.js)/.test(
      html,
    ),
  ).toBeTruthy();
});
