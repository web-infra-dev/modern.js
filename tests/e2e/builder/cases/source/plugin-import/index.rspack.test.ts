import path from 'path';
import { build } from '@scripts/shared';
import { expect, test } from '@modern-js/e2e/playwright';
import { cases, shareTest, copyPkgToNodeModules, findEntry } from './helper';

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
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
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
