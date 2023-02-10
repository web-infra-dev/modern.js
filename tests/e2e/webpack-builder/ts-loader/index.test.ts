import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('build pass with default ts-loader options', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.ts') },
    builderConfig: {
      tools: {
        tsLoader: {},
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const output =
    files[Object.keys(files).find(file => /main\.\w+\.js/.test(file))!];
  expect(output).toBeTruthy();
});
