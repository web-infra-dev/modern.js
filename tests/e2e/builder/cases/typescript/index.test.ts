import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

webpackOnlyTest('should compile const enum correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.ts') },
    builderConfig: {
      output: {
        polyfill: 'off',
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => /index\.\w+\.js/.test(file))!];
  console.log(content);
  expect(content.includes('console.log("fish is :",0)')).toBeTruthy();
});
