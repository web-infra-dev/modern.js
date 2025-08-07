import path from 'node:path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should load postcss.config.ts correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.ts') },
    builderConfig: {
      html: {
        template: './src/index.html',
      },
    },
  });

  const files = await builder.unwrapOutputJSON();
  const indexCssFile = Object.keys(files).find(
    file => file.includes('index.') && file.endsWith('.css'),
  )!;

  expect(files[indexCssFile]).toEqual(
    '.text-3xl{font-size:1.875rem;line-height:2.25rem}.font-bold{font-weight:700}',
  );
});
