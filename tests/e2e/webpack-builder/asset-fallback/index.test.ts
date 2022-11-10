import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should handle unknown modules with fallback rule', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
    builderConfig: {
      output: {
        enableAssetFallback: true,
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const result = Object.keys(files).find(file => file.endsWith('.xxx'));

  expect(result).toBeTruthy();
  expect(/\/static\/media\/foo.\w+.xxx/.test(result!)).toBeTruthy();
});
