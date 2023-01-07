import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should compile const enum correctly', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.ts') },
    builderConfig: {
      output: {
        polyfill: 'off',
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => /main\.\w+\.js/.test(file))!];
  console.log(content);
  expect(content.includes('console.log("fish is :",0)')).toBeTruthy();
});
