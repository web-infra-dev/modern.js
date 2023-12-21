import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

import { pluginStylus } from '@rsbuild/plugin-stylus';

test('should compile stylus and rem correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    plugins: [pluginStylus()],
    builderConfig: {
      output: {
        convertToRem: true,
      },
    },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  if (builder.providerType === 'rspack') {
    expect(content).toEqual(
      'body{color:red;font:.28rem Arial,sans-serif}.title-class-_6c2f8{font-size:.28rem}',
    );
  } else {
    expect(content).toEqual(
      'body{color:red;font:.28rem Arial,sans-serif}.title-class-XQprme{font-size:.28rem}',
    );
  }
});
