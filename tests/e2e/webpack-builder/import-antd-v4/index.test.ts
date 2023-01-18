import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should import antd v4 correctly', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();
  expect(
    Object.keys(files).find(file => file.includes('lib-antd')),
  ).toBeTruthy();
});
