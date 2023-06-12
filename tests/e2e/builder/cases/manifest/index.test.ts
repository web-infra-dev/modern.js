import { join } from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

const fixtures = __dirname;

test('enableAssetManifest', async () => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.jsx'),
    },
  };

  const builder = await build(
    buildOpts,
    {
      output: {
        enableAssetManifest: true,
        legalComments: 'none',
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
    false,
  );

  const files = await builder.unwrapOutputJSON();

  const manifestContent =
    files[
      Object.keys(files).find(file => file.endsWith('asset-manifest.json'))!
    ];

  expect(manifestContent).toBeDefined();

  const manifest = JSON.parse(manifestContent);

  // main.js、index.html、main.js.map
  expect(Object.keys(manifest.files).length).toBe(3);
  expect(manifest.entrypoints.length).toBe(1);

  builder.close();
});
