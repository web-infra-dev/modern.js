import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

webpackOnlyTest('build pass with default ts-loader options', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.ts') },
    builderConfig: {
      tools: {
        tsLoader: {},
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const output =
    files[Object.keys(files).find(file => /index\.\w+\.js/.test(file))!];
  expect(output).toBeTruthy();
});
