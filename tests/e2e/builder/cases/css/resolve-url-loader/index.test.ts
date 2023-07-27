import path from 'path';
import { test, expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should resolve relative asset correctly in SCSS file', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      output: {
        disableSourceMap: {
          js: false,
          css: true,
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  expect(content).toContain('background-image:url(/static/image/icon');
});
