import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { webpackOnlyTest } from '@scripts/helper';
import { build } from '@scripts/shared';

import { builderPluginStylus } from '@modern-js/builder-plugin-stylus';

webpackOnlyTest('should compile stylus correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    plugins: [builderPluginStylus()],
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  expect(content).toEqual(
    'body{color:red;font:14px Arial,sans-serif}.XQprm{font-size:14px}',
  );
});
