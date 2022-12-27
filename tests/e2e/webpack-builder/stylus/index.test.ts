import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { PluginStylus } from '@modern-js/builder-plugin-stylus';

test('should compile stylus correctly', async () => {
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve('./src/index.js') },
    plugins: [PluginStylus()],
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  expect(content).toEqual(
    'body{color:red;font:14px Arial,sans-serif}.XQprm{font-size:14px}',
  );
});
