import * as path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should not optimize lodash bundle size when transformLodash is false', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.ts'),
    },
    builderConfig: {
      performance: {
        transformLodash: false,
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
    runServer: false,
  });

  const { content, size } = await builder.getIndexFile();
  expect(content.includes('debounce')).toBeTruthy();
  expect(size > 30).toBeTruthy();
});
