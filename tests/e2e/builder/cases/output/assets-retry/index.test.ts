import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should inline assets retry runtime code to html by default', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      output: {
        assetsRetry: {},
      },
      tools: {
        htmlPlugin: (config: any) => {
          // minify option should works
          config.minify ??= {};
          // minifyJS will minify function name
          if (typeof config.minify === 'object') {
            config.minify.minifyJS = false;
            config.minify.minifyCSS = false;
          }
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON();
  const htmlFile = Object.keys(files).find(file => file.endsWith('.html'));

  expect(htmlFile).toBeTruthy();
  expect(files[htmlFile!].includes('onRetry')).toBeTruthy();
});

test('should extract assets retry runtime code when inlineScript is false', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      output: {
        assetsRetry: {
          inlineScript: false,
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const htmlFile = Object.keys(files).find(file => file.endsWith('.html'));
  const retryFile = Object.keys(files).find(
    file => file.includes('/assets-retry') && file.endsWith('.js'),
  );

  expect(htmlFile).toBeTruthy();
  expect(retryFile).toBeTruthy();
  expect(files[htmlFile!].includes('onRetry')).toBeFalsy();
});
