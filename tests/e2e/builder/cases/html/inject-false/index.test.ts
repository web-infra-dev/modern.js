import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test.only('builder injection script order should be as expected', async () => {
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

  // only inject once
  expect(
    html.indexOf('/js/assets-retry') === html.lastIndexOf('/js/assets-retry'),
  ).toBeTruthy();

  // assetsRetry => rem => normal resource => template custom resource
  expect(
    html.indexOf('/js/assets-retry') < html.indexOf('/js/convert-rem'),
  ).toBeTruthy();
  expect(
    html.indexOf('/js/convert-rem') < html.indexOf('/js/index'),
  ).toBeTruthy();
  expect(html.indexOf('/js/index') < html.indexOf('/assets/a.js')).toBeTruthy();
});
