import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should compile Node addons correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      environments: {
        server: {
          output: {
            target: 'node',
          },
        },
      },
    },
  });
  const files = await builder.unwrapOutputJSON();
  const addonFile = Object.keys(files).find(file => file.endsWith('a.node'));

  expect(addonFile?.includes('bundles/a.node')).toBeTruthy();
});
