import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should import arco correctly', async () => {
  const builder = await build(
    {
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.ts') },
    },
    undefined,
    false,
  );

  const files = await builder.unwrapOutputJSON();

  expect(
    Object.keys(files).find(
      file => file.includes('lib-arco') && file.includes('.js'),
    ),
  ).toBeTruthy();
  expect(
    Object.keys(files).find(
      file => file.includes('lib-arco') && file.includes('.css'),
    ),
  ).toBeTruthy();
});
