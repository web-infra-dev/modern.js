import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

const fixtures = __dirname;

for (const publicPath of [undefined, '/assets/']) {
  test(`enableAssetManifest with ${publicPath ?? 'default'} publicPath`, async () => {
    const builder = await build({
      cwd: fixtures,
      entry: {
        main: join(fixtures, 'src/index.jsx'),
      },
      builderConfig: {
        output: {
          enableAssetManifest: true,
          legalComments: 'none',
          assetPrefix: publicPath,
        },
        splitChunks: false,
      },
    });

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

    const prefix = publicPath;
    if (prefix) {
      expect(
        Object.values(manifest.files).every(
          file => typeof file === 'string' && file.startsWith(prefix),
        ),
      ).toBe(true);
    }

    await builder.close();
  });
}
