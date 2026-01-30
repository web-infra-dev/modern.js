import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { cases, copyPkgToNodeModules, findEntry, shareTest } from './helper';

test('should import with template config', async () => {
  copyPkgToNodeModules();

  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      source: {
        transformImport: [
          {
            libraryName: 'foo',
            customName: 'foo/lib/{{ member }}',
          },
        ],
      },
      splitChunks: false,
    },
  });
  const files = await builder.unwrapOutputJSON(false);
  const entry = findEntry(files);
  expect(files[entry]).toContain('transformImport test succeed');
});

cases.forEach(c => {
  const [name, entry, config] = c;
  shareTest(`${name}-rspack`, entry, config);
});
