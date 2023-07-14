import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { builderPluginImageCompress } from '@modern-js/builder-plugin-image-compress';
import { providerType } from '@scripts/helper';
import { build } from '@scripts/shared';
import { SharedBuilderPluginAPI } from '@modern-js/builder-shared';

test('should compress image with use builder-plugin-image-compress', async () => {
  let assets: any[];
  await expect(
    build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      plugins: [
        builderPluginImageCompress(),
        {
          name: 'builder-plugin-file-size',

          setup(api: SharedBuilderPluginAPI) {
            api.onAfterBuild(async ({ stats }) => {
              const res = stats?.toJson({
                all: false,
                assets: true,
              });

              const allAssets =
                res?.assets ||
                // @ts-expect-error
                res?.children.reduce(
                  (prev: any[], curr: any) => prev.concat(curr.assets || []),
                  [],
                );

              assets = allAssets?.filter((a: any) =>
                ['.png', '.jpeg', '.ico'].includes(path.extname(a.name)),
              );
            });
          },
        },
      ],
    }),
  ).resolves.toBeDefined();

  expect(
    assets!.find(a => path.extname(a.name) === '.png').size,
  ).toBeLessThanOrEqual(46126);

  if (providerType !== 'rspack') {
    // TODO: rspack stats structure is inconsistent with webpack v5, but it does not affect the use
    assets!.forEach(a => {
      expect(a.info.minimized).toBeTruthy();
    });
  }
});
