import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { allProviderTest } from '@scripts/helper';
import { build } from '@scripts/shared';

import { builderPluginStylus } from '@modern-js/builder-plugin-stylus';

allProviderTest('should compile stylus and rem correctly', async () => {
  const builder = await build(
    {
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      plugins: [builderPluginStylus()],
    },
    {
      output: {
        convertToRem: true,
      },
    },
  );
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  if (builder.providerType === 'rspack') {
    expect(content).toEqual(
      'body{color:#f00;font:.28rem Arial,sans-serif}.KPtXW{font-size:.28rem}',
    );
  } else {
    expect(content).toEqual(
      'body{color:red;font:.28rem Arial,sans-serif}.XQprm{font-size:.28rem}',
    );
  }
});
