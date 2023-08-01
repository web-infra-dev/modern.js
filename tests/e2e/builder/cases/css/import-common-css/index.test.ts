import path from 'path';
import { test, expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should compile common css import correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      source: {
        alias: {
          '@': './src',
        },
      },
    },
  });

  const files = await builder.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find(file => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual(
    'html{min-height:100%}#a{color:red}#b{color:blue}',
  );
});
