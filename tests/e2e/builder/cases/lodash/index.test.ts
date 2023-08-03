import assert from 'assert';
import * as path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

// TODO: needs builtin:swc-loader
webpackOnlyTest('should optimize lodash bundle size by default', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/main.ts'),
    },
    builderConfig: {
      output: {
        polyfill: 'entry',
      },
    },
  });

  const files = await builder.unwrapOutputJSON();
  const [lodashBundle, content] =
    Object.entries(files).find(([file]) => file.includes('lib-lodash')) || [];

  assert(lodashBundle);

  const bundleSize = content!.length / 1024;

  expect(content?.includes('debounce')).toBeFalsy();

  expect(bundleSize < 10).toBeTruthy();

  builder.close();
});
